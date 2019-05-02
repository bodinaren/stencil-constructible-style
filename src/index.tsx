import { h, Host, getElement } from "@stencil/core";
import { VNode, ComponentInstance } from "@stencil/core/dist/declarations";

const supportsConstructibleStylesheets = (() => {
  try { return !!new CSSStyleSheet(); }
  catch (e) { return false; }
})();

declare type ConstructibleStyleDecorator = (target: ComponentInstance, propertyKey: string) => void

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
  
  return (target: ComponentInstance, propertyKey: string) => {

    if (!opts.cacheKeyProperty) {
      opts.cacheKeyProperty = propertyKey;
    }

    const { componentWillLoad, render } = target;

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
        const style = <style type="text/css">{ cssText }</style>;

        if (isHost(renderedNode)) {
          (getHostChildren(renderedNode) || []).push(style);
        } else {
          renderedNode = <Host>{ renderedNode }</Host>;
        }

        return renderedNode;
      }
    }
  };
}

function getOrCreateStylesheet(
  instance: ComponentInstance,
  target: ComponentInstance,
  cssText: string,
  opts: ConstructibleStyleOptions,
): CSSStyleSheet {

  if (!target.__constructableStylesheets) {
    target.__constructableStylesheets = {};
  }

  let key = instance[opts.cacheKeyProperty];

  if (!target.__constructableStylesheets[key]) {

    target.__constructableStylesheets[key] = new CSSStyleSheet();
    target.__constructableStylesheets[key].replace(cssText);
  }

  return target.__constructableStylesheets[key];
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
