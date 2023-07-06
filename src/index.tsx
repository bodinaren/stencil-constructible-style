import { h, Host, getElement, VNode, ComponentInterface } from "@stencil/core";

const supportsConstructibleStylesheets = (() => {
  try { return !!new CSSStyleSheet(); }
  catch (e) { return false; }
})();

declare type ConstructibleStyleDecorator = (target: ComponentInterface, propertyKey: string) => void

/**
 * Dynamically create a constructible stylesheet which is applied to the component.
 * The stylesheet is then cached for future instances of the component.
 * @usage
As a string:
```
@ConstructableStyle() style = `.bg { background: url('assets/${ this.mode }/bg.png'); }`;
```
As a function:
```
@ConstructableStyle() style = () => `.bg { background: url('assets/${ this.mode }/bg.png'); }`;
```
 */
export function ConstructibleStyle(
  opts: ConstructibleStyleOptions = {}
): ConstructibleStyleDecorator {
  
  return (target: ComponentInterface, propertyKey: string) => {

    if (!opts.cacheKeyProperty) {
      opts.cacheKeyProperty = propertyKey;
    }

    const { componentWillLoad, render } = target;
    if (!componentWillLoad) console.warn(`ConstructibleStyle requires you to have a \`componentWillLoad\` lifecycle method in \`${ target.constructor.name }\`. Failure to add this function may cause ConstructibleStyle to fail due to StencilJS build optimizations.`);

    if (supportsConstructibleStylesheets) {
      target.componentWillLoad = function() {
        const cssText = (typeof this[propertyKey] === "function" ? this[propertyKey]() : this[propertyKey]);
        const willLoadResult = componentWillLoad && componentWillLoad.call(this);

        const host = getElement(this);
        const root = (host.shadowRoot || host) as any;
        root.adoptedStyleSheets = [...root.adoptedStyleSheets || [], getOrCreateStylesheet(this, target, cssText, opts)];
  
        return willLoadResult;
      }

    } else {
      target.render = function() {
        const cssText = (typeof this[propertyKey] === "function" ? this[propertyKey]() : this[propertyKey]);
        let renderedNode: VNode = render.call(this);

        if (isHost(renderedNode)) {
          appendStyleToHost(renderedNode, target.constructor.name, cssText);

        } else {
          renderedNode = <Host>{ renderedNode }</Host>;

          if (!('attachShadow' in HTMLElement.prototype)) {
            appendStyleToHost(renderedNode, target.constructor.name, cssText);

          } else {
            if (!target.__constructableStyle) {
              let style = document.createElement("style");
              style.setAttribute("type", "text/css");
              style.setAttribute("constructible-style", target.constructor.name);
              style.innerHTML = cssText;
              target.__constructableStyle = style;
              document.head.appendChild(style);
            }
          }
        }

        return renderedNode;
      }
    }
  };
}

function appendStyleToHost(node, targetName, cssText) {
  (getHostChildren(node) || []).push(
    <style type="text/css" constructible-style={ targetName }>{ cssText }</style>
  );
}

function getOrCreateStylesheet(
  instance: ComponentInterface,
  target: ComponentInterface,
  cssText: string,
  opts: ConstructibleStyleOptions,
): CSSStyleSheet {

  if (!target.__constructableStyle) {
    target.__constructableStyle = {};
  }

  let key = instance[opts.cacheKeyProperty];

  if (!target.__constructableStyle[key]) {

    target.__constructableStyle[key] = new CSSStyleSheet();
    target.__constructableStyle[key].replace(cssText);
  }

  return target.__constructableStyle[key];
}

function isHost(node): boolean {
  for (let prop in node) {
    if (node.hasOwnProperty(prop)) {
      if (node[prop] === Host) {
        return true;
      }
    }
  }
  return false;
}

function getHostChildren(node): Array<VNode> {
  for (let prop in node) {
    if (node.hasOwnProperty(prop)) {
      if (Array.isArray(node[prop])) {
        return node[prop];
      }
    }
  }
}

export interface ConstructibleStyleOptions {
  /**
   * Set this in case an instance of a component could produce different styles based on variables.
   * This will ensure that you get new styles for each mode.
   * @example
```
@Prop() mode: string;
@ConstructableStyle({ cacheKeyProperty: "mode" }) style = `.bg { background: url('assets/${ this.mode }/bg.png'); }`;
```
   */
  cacheKeyProperty?: string;
}
