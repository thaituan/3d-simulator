// Module augmentations to loosen JSX intrinsic element checks for React.
// The React runtime types (react/jsx-runtime and react/jsx-dev-runtime) both
// define `IntrinsicElements` as extending `React.JSX.IntrinsicElements`, so
// adding a string index signature here effectively allows *any* tag in TSX,
// including custom web components like `<model-viewer>`.

// Only the index signature is added; nothing else is exported or changed, so the
// regular React types (hooks, components, etc.) remain untouched.

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react/jsx-dev-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};