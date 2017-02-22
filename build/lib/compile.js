const fs = require('fs-extra');
const path = require('path');
const frontmatter = require('front-matter');
const marked = require('marked');
const highlighter = require('highlight.js');
const ejs = require('ejs');
const forIn = require('lodash/forIn');
const globalData = require('./global-data');

const ejsOptions = {
  // This is necessary so that ejs will find our real includes, since it looks relative to this filename
  root: path.resolve(path.join(__dirname, '..', '..', 'src', 'includes'))
};

const helpers = {
  forIn,
  markdown: marked
};

marked.setOptions({
  highlight(code) {
    return highlighter.highlightAuto(code).value;
  }
});

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
    try {
      compiled = ejs.compile(compiled, ejsOptions);
    } catch(e) {
      console.error('Template failed to compile!');
      console.error('==> Template:', templatePath);
      console.error('==> Destination:', outputPath);
      console.error('==> Data:\n', data);
      console.error('==> Error:');
      throw e;
    }
    template = function runTemplate(...datas) {
      let mergedData = Object.assign(...datas, templateSource.attributes);
      let result;
      try {
        result = compiled(mergedData);
      } catch(e) {
        console.error('Templating failed!');
        console.error('==> Template:', templatePath);
        console.error('==> Destination:', outputPath);
        console.error('==> Data:\n', data);
        console.error('==> Error:');
        throw e;
      }
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
