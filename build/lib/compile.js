const fs = require('fs-extra');
const path = require('path');
const frontmatter = require('front-matter');
const marked = require('marked');
const ejs = require('ejs');
const forIn = require('lodash/forIn');
const globalData = require('./global-data');

const ejsOptions = {
  filename: path.resolve(path.join(__dirname, '..', '..', 'src', 'includes', '-fake-template-name'))
};

const helpers = {
  forIn,
  markdown: marked
};

module.exports = function compile(templatePath, data = {}, outputPath) {
  // Load the template
  let templateSource = fs.readFileSync(templatePath, 'utf-8');
  templateSource = frontmatter(templateSource);
  let template;
  try {
    let compiled = templateSource.body;
    // Compile Markdown
    if (path.extname(templatePath) === '.md') {
      compiled = marked(compiled);
    }
    // Compile EJS
    compiled = ejs.compile(compiled, ejsOptions);
    template = function runTemplate(...datas) {
      let mergedData = Object.assign(...datas, templateSource.attributes);
      let result = compiled(mergedData);
      // Render into a layout if specified
      if (mergedData.layout) {
        let layoutPath = path.join('src', 'layouts', mergedData.layout + '.ejs');
        let layoutData = Object.assign(mergedData, { content: result, layout: null });
        return compile(layoutPath, layoutData, outputPath);
      }
      // Otherwise render with no layout
      return result;
    };
  } catch (e) {
    console.log(`error while compiling template at: ${ templatePath }`);
    throw e;
  }
  let result = template(Object.assign({}, helpers, globalData, data));
  // Write to the output file if provided
  if (outputPath) {
    fs.mkdirpSync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, result);
  }
  return result;
};
