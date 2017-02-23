const marked = require('marked');
const forIn = require('lodash/forIn');
const kebabCase = require('lodash/kebabCase');
const highlighter = require('highlight.js');

marked.setOptions({
  highlight(code) {
    return highlighter.highlightAuto(code).value;
  }
});

let helpers = {
  forIn,
  markdown: marked,
  hasTag(item, tagName) {
    let comment = helpers.commentFor(item);
    if (!comment || !comment.tags) {
      return false;
    }
    return comment.tags.find((t) => t.tag === tagName);
  },
  sourceFile(item) {
    return item.sources[0].fileName.split('/').slice(2).join('/');
  },
  sourceLine(item) {
    return item.sources[0].line;
  },
  commentFor(item) {
    if (item.kindString === 'function') {
      return item.signatures[0].comment || {};
    }
    return item.comment || {};
  },
  typeToString(type) {
    if (!type) {
      return '';
    }
    let str = type.name;
    if (type.typeArguments && type.typeArguments.length > 0) {
      str += '<';
      str += type.typeArguments.join(', ');
      str += '>';
    }
    return str;
  },
  urlForReference(type, version) {
    let referencedExportedItem = version.data.exportedItems.find(({ item }) => item.id === type.id);
    if (referencedExportedItem) {
      return '/api/' + version.ref + '/' + referencedExportedItem.item.package + '/' + kebabCase(referencedExportedItem.item.name);
    }
    return '';
  }
};

module.exports = helpers;