// Global declarations that are automatically picked up by TypeScript in the
// `src` directory. Putting the custom JSX element here avoids needing to import a
// module anywhere in the codebase.

// The `model-viewer` element comes from Google's `<model-viewer>` web component
// script included in index.html. We don't have detailed typings, so use `any`.

// Augment the global JSX namespace rather than creating a module-local
// namespace. The `export {}` at the bottom still ensures this file is treated as
// a module, which is necessary for `declare global` to work inside it.

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Accept any custom element (including <model-viewer>) so we don't have to
      // keep updating this list when new web components are added.
      [elemName: string]: any;
    }
  }
}

// Make sure the React namespace itself has the same loose mapping. This affects
// the `react/jsx-runtime` transform because it extends
// `React.JSX.IntrinsicElements`.
declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};