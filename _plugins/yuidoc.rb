require 'git'
require 'semantic'
require 'json'
require 'active_support/inflector'

module Jekyll
  class DocGenerator < Generator

    SemVerRegexp = /\A(\d+\.\d+\.\d+)(-([0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*))?(\+([0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*))?\Z/

    def generate(site)
      repo = Git.init(site.source)
      versions = repo.tags.select do |tag|
        tag =~ SemVerRegexp
      end
      versions.push('master')
      versions_data = site.data['api_versions'] = {}
      repo.with_temp_index do
        versions.map do |version|
          version_name = version == 'master' ? 'latest' : version
          Dir.mktmpdir do |tmpdir|
            repo.read_tree(version)
            repo.checkout_index(prefix: tmpdir + '/', all: true)
            versions_data[version_name] = self.generate_api_docs_for_version(site, version_name, tmpdir)
            self.generate_guides_for_version(site, version_name, version_dir)
          end
        end
      end
    end

    def generate_api_docs_for_version(site, version_name, version_dir)
      outdir = File.join(version_dir, 'out')
      `yuidoc -p -o #{outdir} #{version_dir}`
      raw = File.read(File.join(outdir, 'data.json'))
      version_data = JSON.parse(raw)
      [ 'classes', 'modules' ].each do |file_type|
        version_data[file_type].each do |item_name, item_data|
          dir = "api/#{version_name}/#{file_type}/"
          name = item_name.parameterize + '.html'
          site.pages << APIDocPage.new(site, site.source, dir, name, item_data, "api-#{file_type.singularize}.html")
        end
      end
      version_data
    end

    def generate_guides_for_version(version_name, version_dir)
      guides_dir = File.join(version_dir, 'docs')
      guides = Dir.glob(File.join(guides_dir, '**', '*')).reject do |item|
        File.directory? item
      end
      guides.each do |guide|
        dir = File.dirname(guide)
        name = File.base_name(guide)
        site.pages << Page.new(site, site.source, dir, name)
      end
    end

  end

  class APIDocPage < Page
    def initialize(site, base, dir, name, data, template)
      @site = site
      @base = base
      @dir = dir
      @name = name

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), template)
      self.data.merge!(data)
    end
  end

end
