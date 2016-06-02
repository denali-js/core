require 'git'
require 'semantic'
require 'json'
require 'active_support/inflector'

module Jekyll
  class DocGenerator < Generator

    SemVerRegexp = /\A(\d+\.\d+\.\d+)(-([0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*))?(\+([0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*))?\Z/

    def generate(site)
      @site = site
      @repo = Git.init(@site.config['source_repo'] || @site.source)
      @versions_data = @site.data['versions'] = {}
      self.build_versions()
    end

    def build_versions
      @repo.with_temp_index do
        versions = self.discover_versions
        versions.map do |version|
          version_alias = @site.config['version_aliases'] && @site.config['version_aliases'][version] || version
          version_data = @versions_data[version_alias] = { 'ref' => version_alias, 'original_ref' => version }
          Dir.mktmpdir(nil, File.join(@site.source, 'tmp')) do |tmpdir|
            self.build_version(version, tmpdir, version_data)
          end
        end
      end
    end

    def discover_versions
      versions = @repo.tags.select do |tag|
        tag =~ SemVerRegexp
      end
      versions.sort! { |a, b| Semantic::Version.new(a) <=> Semantic::Version.new(b) }
      @site.config['latest'] = versions.last
      (@site.config['additional_version_refs'] || []).concat(versions)
    end

    def build_version(version, tmpdir, data)
      @repo.read_tree(version)
      @repo.checkout_index(prefix: tmpdir + '/', all: true)
      if @site.config.has_key?('version_aliases') && @site.config['version_aliases'].has_key?(version)
        version = @site.config['version_aliases'][version]
      end
      data['api'] = self.generate_api_docs(version, tmpdir)
      data['guides'] = self.generate_guides(version, tmpdir)
    end

    def generate_api_docs(version, source_dir)
      yuidoc_data = self.parse_yuidocs(source_dir, version)

      # Convert filenames to project-relative paths
      yuidoc_data['classes'].each_value do |item_data|
        self.convert_item_filepath_to_relative_path(source_dir, item_data)
      end
      yuidoc_data['modules'].each_value do |item_data|
        self.convert_item_filepath_to_relative_path(source_dir, item_data)
      end
      yuidoc_data['classitems'].each do |item_data|
        self.convert_item_filepath_to_relative_path(source_dir, item_data)
      end

      # Generate classes and modules pages, the two top level types of files
      yuidoc_data['classes'].each do |item_name, item_data|
        @site.pages << APIClassPage.new(@site, item_name, item_data, version, yuidoc_data, @versions_data)
      end
      yuidoc_data['modules'].each do |item_name, item_data|
        @site.pages << APIModulePage.new(@site, item_name, item_data, version, yuidoc_data, @versions_data)
      end

      @site.pages << APIRootPage.new(@site, version, yuidoc_data, @versions_data)

      yuidoc_data
    end

    def parse_yuidocs(source_dir, version)
      outdir = File.join(source_dir, 'out')
      `yuidoc -p -q -o #{outdir} #{source_dir}`
      # Include yuidoc's json data in output for debugging purposes
      @site.pages << YUIDocData.new(@site, outdir, '.', 'data.json', version)
      raw = File.read(File.join(outdir, 'data.json'))
      JSON.parse(raw)
    end

    def convert_item_filepath_to_relative_path(relative_to_dir, item)
      if item.key?('file')
        original_pathname = Pathname.new(item['file'])
        relative_dir_pathname = Pathname.new(relative_to_dir)
        item['file'] = original_pathname.relative_path_from(relative_dir_pathname).to_s
      end
    end

    def generate_guides(version, source_dir)
      data = []
      guides = self.discover_guides(source_dir)
      guides.each do |guide|
        relative_dir = self.relative_dir_for_guide(source_dir, guide)
        name = File.basename(guide)
        page = GuidePage.new(@site, source_dir, relative_dir, name, version, @versions_data)
        @site.pages << page
        data << page.data
      end
      @site.config['guide_categories'] = self.sort_guide_categories
      data
    end

    def sort_guide_categories()
      categories = {}
      @site.pages.each do |page|
        if page.is_a?(GuidePage)
          category = categories[page.data['category'] || 'Uncategorized'] ||= []
          category << page
        end
      end
      # Sort guides within the same category via linked list
      categories.each do |category_name, guides|
        sorted_guides = []
        (0..guides.length).each do |i|
          index_of_next_guide = guides.find_index do |guide|
            last_title = sorted_guides.last && sorted_guides.last.data['title']
            guide.data['after'] == last_title
          end
          if !index_of_next_guide.nil?
            sorted_guides << guides[index_of_next_guide]
          end
        end
        if guides.length > sorted_guides.length
          dangling_guide_names = (guides - sorted_guides)
          dangling_guide_names = dangling_guide_names.map { |guide| guide.data['title'] }
          puts "WARNING: The linked list for sorting guides is broken. The #{dangling_guide_names.join(', ')} guide(s) were not added to the left nav because they didn't properly point to which guide they appear underneath. You most likely have an incorrect, missing, or duplicate 'after:' for this guide."
        end
        categories[category_name] = sorted_guides
      end
      categories.sort_by do |category_name, guides|
        guide_with_category_order = guides.find{ |guide|
          !guide.data.nil? && guide.data.has_key?('category_order')
        }
        if guide_with_category_order.nil?
          raise Exception.new("Unable to find a category order for #{category_name} guides category - make sure at least one guide in that category includes a `category_order` value in its front matter")
        end
        guide_with_category_order.data['category_order']
      end
    end

    def discover_guides(source_dir)
      guides_dir = File.join(source_dir, @site.config['guides_dir'] || 'guides')
      guides_glob = @site.config['guides_glob'] || File.join(guides_dir, '**', '*')
      Dir.glob(guides_glob).reject do |item|
        File.directory? item
      end
    end

    def relative_dir_for_guide(source_dir, guide_path)
      guide_pathname = Pathname.new(File.dirname(guide_path))
      source_pathname = Pathname.new(source_dir)
      guide_pathname.relative_path_from(source_pathname).to_s
    end

  end

  class APIDocPage < Page
    def initialize(site, name, data, version, version_data, all_versions_data)
      @site = site
      @base = site.source
      @dir = File.join(version, 'api', @file_type)
      @name = name + '.html'

      self.process(@name)
      self.read_yaml(File.join(@base, '_layouts'), "api-#{@file_type}.html")
      self.data.merge!({
        "versions" => all_versions_data,
        "version" => all_versions_data[version]
      })
      self.data.merge!(self.api_data_for_page(data, version_data, all_versions_data))
    end

    def api_data_for_page(data, version, all_versions_data)
      raise "You must define a data payload for this type of API page"
    end
  end

  class APIModulePage < APIDocPage
    def initialize(site, name, data, version, version_data, all_versions_data)
      @file_type = 'modules'
      super(site, name, data, version, version_data, all_versions_data)
    end

    def api_data_for_page(data, version_data, all_versions_data)
      {
        "module" => data
      }
    end
  end

  class APIClassPage < APIDocPage
    def initialize(site, name, data, version, version_data, all_versions_data)
      @file_type = 'classes'
      super(site, name, data, version, version_data, all_versions_data)
    end

    def api_data_for_page(data, version_data, all_versions_data)
      modules_data = version_data['modules']
      data['classitems'] = version_data['classitems'].select { |classitem| classitem['class'] == data['name'] }
      data['classitems'] = data['classitems'].sort_by { |classitem| classitem['name'] || '' }
      {
        "class" => data
      }
    end
  end

  class APIRootPage < Page
    def initialize(site, version, version_data, all_versions_data)
      @site = site
      @base = site.source
      @dir = File.join(version, 'api')
      @name = 'index.html'

      self.process(@name)
      self.read_yaml(@base, "api.html")
      self.data.merge!({
        "versions" => all_versions_data,
        "version" => all_versions_data[version]
      })
      self.data.merge!(version_data)
    end
  end

  class GuidePage < Page
    def initialize(site, base, dir, name, version, versions_data)
      super(site, base, dir, name)
      @version = version
      self.data.merge!({ 'versions' => versions_data, 'version' => versions_data[version] })
    end
    def destination(dest)
      relative_dest = Pathname.new(super(dest)).relative_path_from(Pathname.new(dest)).to_s
      File.join(dest, @version, relative_dest)
    end
  end

  class YUIDocData < Page
    def initialize(site, base, dir, name, version)
      super(site, base, dir, name)
      @version = version
    end
    def destination(dest)
      relative_dest = Pathname.new(super(dest)).relative_path_from(Pathname.new(dest)).to_s
      File.join(dest, @version, relative_dest)
    end
  end

end
