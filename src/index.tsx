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
        const willLoadResult = componentWillLoad && componentWillLoad.call(this);

        const host = getElement(this);
        const root = (host.shadowRoot || host) as any;
        root.adoptedStyleSheets = [...root.adoptedStyleSheets || [], getOrCreateStylesheet(this, target, propertyKey, opts)];
  
        return willLoadResult;
      }

    } else {
      target.render = function() {
        let renderedNode: VNode = render.call(this);
        const style = createVDomStyleTag(this[propertyKey]);

        if (typeof renderedNode === "string" || typeof renderedNode.$tag$ !== "object") {
          // render did not return a Host, create one to ensure $children$.push can insert the style as expected.
          renderedNode = <Host>{ renderedNode }</Host>;
        }
        renderedNode.$children$.push(style);
        
        return renderedNode;
      }
    }
  };
}

function getOrCreateStylesheet(
  instance: ComponentInstance,
  target: ComponentInstance,
  prop: string,
  opts: ConstructibleStyleOptions,
): CSSStyleSheet {

  if (!target.__constructableStylesheets) {
    target.__constructableStylesheets = {};
  }

  let key = instance[opts.cacheKeyProperty];

  if (!target.__constructableStylesheets[key]) {
    let style = instance[prop];
    if (typeof style === "function") style = style();

    target.__constructableStylesheets[key] = new CSSStyleSheet();
    target.__constructableStylesheets[key].replace(style);
  }

  return target.__constructableStylesheets[key];
}

function createVDomStyleTag(cssText: string): VNode {
  return {
    $tag$: "style",
    $children$: [{
      $text$: cssText,
      $flags$: 0,
    }],
    $flags$: 0,
    $attrs$: { type: "text/css" },
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
