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
  kebabCase,
  markdown: marked,
  inspect: require('util').inspect,
  getTag(item, tagName) {
    let comment = helpers.commentFor(item);
    if (!comment || !comment.tags) {
      return false;
    }
    let tag = comment.tags.find((t) => t.tag === tagName);
    if (tag) {
      return tag.text;
    }
    return false;
  },
  isDeprecated(item) {
    return Boolean(helpers.getTag(item, 'deprecated'));
  },
  isPrivate(item) {
    return !Boolean(helpers.getTag(item, 'since'));
  },
  isInherited(item) {
    return Boolean(item.inheritedFrom);
  },
  visibilityClassesFor(item) {
    let classes = '';
    if (helpers.isDeprecated(item)) {
      classes += 'deprecated-item';
    }
    if (helpers.isPrivate(item)) {
      classes += 'private-item';
    }
    if (helpers.isInherited(item)) {
      classes += 'inherited-item';
    }
    return classes;
  },
  sourceFile(item) {
    return item.sources[0].fileName.split('/').slice(2).join('/');
  },
  sourceLine(item) {
    return item.sources[0].line;
  },
  commentFor(item) {
    if (item.kindString === 'Function' || item.kindString === 'Method') {
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
  },
  urlForItem(item, version) {
    return `/${ version.name }/api/${ item.package }/${ kebabCase(item.name) }`;
  },
  filterChildren(item, conditions) {
    return item.children.filter((child) => {
      let doesChildMatch = true;
      if (conditions.kind) {
        doesChildMatch = doesChildMatch && child.kindString.toLowerCase() === conditions.kind;
      }
      if (conditions.static != null) {
        doesChildMatch = doesChildMatch && ((conditions.static && child.flags.isStatic) || (!conditions.static && !child.flags.isStatic));
      }
      return doesChildMatch;
    });
  },
  signatureFor(method) {
    let signature = '(';
    let params = (method.signatures[0].parameters || []).map((param) => {
      let name = param.name;
      if (param.flags && param.flags.isRest) {
        name = `...${ name }`;
      }
      return name;
    });
    signature += params.join(', ');
    signature += ')';
    return signature;
  }
};

module.exports = helpers;