# stencil-constructible-style

![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

## What is it?

`stencil-constructible-style` gives you the ability to add dynamic styles as constructible stylesheets, with a fallback for non-supported browsers.

## Why? Don't Stencil do this already?

Yes, for your `.css`-files they do. But what if your style depends on some variables? Then you end up having to write `<style>` tags in your `render` function.
Or if you host your code from a CDN, such as unpkg.com? Then the assets folder will not be on a relative URL, as it would be relative to the website your web components are being used on (`getAssetPath` to the rescue!).

## How to use it?

```ts
import { Component, Element, getAssetPath } from "@stencil/core";
import { ConstructibleStyle } from "stencil-constructible-style";

@Component({...})
export class MyComponent {
  @ConstructibleStyle() styles = `
    .classIcon { background: url(${ getAssetPath("../assets/class-icon.png") }); }
  `;
}
```

You can also set the `ConstructibleStyle` to a function in case you want to avoid running it for every instance of the component.
The above would be:
```ts
@ConstructibleStyle() styles = () => `
  .classIcon { background: url(${ getAssetPath("../assets/class-icon.png") }); }
`;
```

### Caching

The stylesheet, once constructed, is cached statically per component and therefore won't be recreated when new instances of the component are created. This could be a problem if you have variables that affects that stylesheet. That's where the `cacheKeyProperty` option comes in.

```ts
import { Component, Element, getAssetPath } from "@stencil/core";
import { ConstructibleStyle } from "stencil-constructible-style";

@Component({...})
export class MyComponent {
  @Prop() myClass: string;

  @ConstructibleStyle({ cacheKeyProperty: "myClass" }) styles = `
    .classIcon { background: url(${ getAssetPath(`../assets/${ this.myClass }-icon.png`) }); }
  `;
}
```

`ConstructibleStyle` runs after your `componentWillLoad`, so if you have multiple variables that affects your styles and want them all to be relevant in your key, you can prepare a unique key during `componentWillLoad`.

```ts
@Component({...})
export class MyComponent {
  @Prop() myClass: string;
  @Prop() mode: string;

  private cacheKey: string;

  componentWillLoad() {
    this.cacheKey = `${ this.myClass }-${ this.mode }`;
  }

  @ConstructibleStyle({ cacheKeyProperty: "cacheKey" }) styles = `
    .classIcon { background: url(${ getAssetPath(`../assets/${ this.myClass }-${ this.mode }-icon.png`) }); }
  `;
}
```

## What about browsers that don't suppot Constructible Stylesheets?

If `new CSSStyleSheet()` can't be called (same check that Stencil itself uses), the decorator will fall back to render a `<style>` element to the end of your rendered output.
