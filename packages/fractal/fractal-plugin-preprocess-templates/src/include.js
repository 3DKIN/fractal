const {extname} = require('path');
const visit = require('unist-util-visit');
const is = require('hast-util-is-element');
const removePosition = require('unist-util-remove-position');

module.exports = function (tree, context, env) {
  const parent = env.component;

  visit(tree, 'element', function (node, index, parentNode) {
    if (is(node, 'include')) {
      if (!node.properties.component) {
        throw new Error(`You must provide a 'component' attribute for the 'include' tag ${parent.id}`);
      }
      const [componentId, variantId] = node.properties.component.split(':');
      const subComponent = env.components.find(componentId);
      if (subComponent.id === parent.id) {
        throw new Error(`Recursive component include detected! Ignoring component.`);
      }

      const subComponentVariant = subComponent.getVariant(variantId);
      const templateExt = extname(env.template.filename);
      const template = subComponentVariant.getTemplate(templateExt);

      if (!template) {
        throw new Error(`Could not find '${templateExt}' template for component ${subComponent.ifd}`);
      }

      const componentNodes = removePosition(template.clone().contents).children;
      parentNode.children.splice(index, 1, ...componentNodes);
    }
  });
  return tree;
};
