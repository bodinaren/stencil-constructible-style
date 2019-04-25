import { h, Host } from "@stencil/core";
import { VNode } from "@stencil/core/dist/declarations";

export function ConstructableStyle(options: ConstructableStyleOptions = {}) {
  return (proto: any, prop: any) => {

    validate(proto, prop, options);

    const { componentWillLoad, render } = proto;

    if ("CSSStyleSheet" in window) {
      proto.componentWillLoad = function() {
        const willLoadResult = componentWillLoad && componentWillLoad.call(this);
        const host = this[options.hostProperty];
        const root = (host.shadowRoot || host);

        root.adoptedStyleSheets = [...root.adoptedStyleSheets || [], getOrCreateStylesheet(this, proto, prop, options)];

        return willLoadResult;
      }

    } else {
      proto.render = function() {
        let renderedNode: VNode = render.call(this);
        const style = createVDomStyle(this[prop]);

        if (typeof renderedNode === "string" || typeof renderedNode.$tag$ !== "object") {
          // render did not return a Host, create one to ensure $children$.push we can insert the style as expected.
          renderedNode = <Host>{ renderedNode }</Host>;
        }
        renderedNode.$children$.push(style);
        
        return renderedNode;
      }
    }
  };
}

export function ConstructableStyleHost() {
  return (proto: any, prop: any) => {
    proto.__constructableStyleHost = prop;
  }
}

function validate(proto, prop, options): boolean {
  if (!options.cacheKeyProperty) {
    options.cacheKeyProperty = prop;
  }

  if (!proto["__constructableStyleHost"] && !options.hostProperty) {
    throw new Error(
      "@ConstructableStyle() decorator requires either a @ConstructableStyleHost(), or a `hostProperty` argument that matches the name of the `@Element()` property."
    );
  } else if (!options.hostProperty) {
    options.hostProperty = proto["__constructableStyleHost"];
  }

  return true;
}

function getOrCreateStylesheet(component: any, proto: any, prop: any, options: ConstructableStyleOptions): CSSStyleSheet {
  if (!proto.__constructableStylesheet) {
    proto.__constructableStylesheet = {};
  }

  let key = component[options.cacheKeyProperty];

  if (!proto.__constructableStylesheet[key]) {
    proto.__constructableStylesheet[key] = new CSSStyleSheet()
    proto.__constructableStylesheet[key].replace(component[prop]);
  }

  return proto.__constructableStylesheet[key];
}

function createVDomStyle(cssText: string): VNode {
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

export interface ConstructableStyleOptions {
  /** The name of the property that has the @Element() decorator. Required unless `@ConstructableStyleHost()` is used. */
  hostProperty?: string;

  /**
   * Set this in case an instance of a component could produce different styles. This will ensure that you get new styles for each mode.
   * @example
```
@Prop() mode: string;
@ConstructableStyle({ keyProperty: "mode" }) style = `.bg { background: url('assets/${ this.mode }/bg.png'); }`;
```
   */
  cacheKeyProperty?: string;
}
