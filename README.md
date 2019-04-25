# stencil-constructable-style

![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

## What is it?

`stencil-constructable-style` gives you the ability to add dynamic styles as constructable stylesheets, with a fallback for legacy browsers.

## Why? Don't Stencil do this already?

Yes, for your `.css`-files they do. But what if your style depends on some variables? Then you end up having to write `<style>` tags in your `render` function. Or if you host your code from a CDN, such as unpkg.com. Then the assets folder will not be on a relative URL, as it would be relative to the website your web components are being used on (`getAssetPath` to the rescue!).

## How to use it?

Alternative 1, using `hostProperty`:
```ts
import { Component, Element, getAssetPath } from "@stencil/core";
import { ConstructableStyle } from "stencil-constructable-style";

@Component({...})
export class MyComponent {
  @Element() host;

  @ConstructableStyle({ hostProperty: "host" }) styles = `
    .classIcon { background: url(${ getAssetPath("../assets/class-icon.png") }); }
  `;
}
```

Alternative 2, using `ConstructableStyleHost`:
```ts
import { Component, Element, getAssetPath } from "@stencil/core";
import { ConstructableStyleHost, ConstructableStyle } from "stencil-constructable-style";

@Component({...})
export class MyComponent {
  @ConstructableStyleHost() @Element() host;

  @ConstructableStyle() styles = `
    .classIcon { background: url(${ getAssetPath("../assets/class-icon.png") }); }
  `;
}
```

## What about legacy browsers?

`if (!("CSSStyleSheet" in window))`, the decorator will fall back to render a `<style>` element to the end of your rendered output. If your render returns a `<Host>`, it'll be put in there. If it instead returns another element, or just text, a `<Host>` will be created and your content will be put in there along with the style.
