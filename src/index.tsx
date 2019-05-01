import { h, Host, getElement } from "@stencil/core";
import { VNode } from "@stencil/core/dist/declarations";

const supportsConstructibleStylesheets = (() => {
  try { return !!new CSSStyleSheet(); }
  catch (e) { return false; }
})();

export function ConstructibleStyle(options: ConstructibleStyleOptions = {}) {
  return (proto: any, prop: any) => {

    if (!options.cacheKeyProperty) {
      options.cacheKeyProperty = prop;
    }

    const { componentWillLoad, render } = proto;

    if (supportsConstructibleStylesheets) {
      proto.componentWillLoad = function() {
        const willLoadResult = componentWillLoad && componentWillLoad.call(this);

        const host = getElement(this);
        const root = (host.shadowRoot || host) as any;
        root.adoptedStyleSheets = [...root.adoptedStyleSheets || [], getOrCreateStylesheet(this, proto, prop, options)];
  
        return willLoadResult;
      }

    } else {
      proto.render = function() {
        let renderedNode: VNode = render.call(this);
        const style = createVDomStyleTag(this[prop]);

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

function getOrCreateStylesheet(component: any, proto: any, prop: any, options: ConstructibleStyleOptions): CSSStyleSheet {
  if (!proto.__constructableStylesheets) {
    proto.__constructableStylesheets = {};
  }

  let key = component[options.cacheKeyProperty];

  if (!proto.__constructableStylesheets[key]) {
    proto.__constructableStylesheets[key] = new CSSStyleSheet()
    proto.__constructableStylesheets[key].replace(component[prop]);
  }

  return proto.__constructableStylesheets[key];
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
   * Set this in case an instance of a component could produce different styles. This will ensure that you get new styles for each mode.
   * @example
```
@Prop() mode: string;
@ConstructableStyle({ cacheKeyProperty: "mode" }) style = `.bg { background: url('assets/${ this.mode }/bg.png'); }`;
```
   */
  cacheKeyProperty?: string;
}
