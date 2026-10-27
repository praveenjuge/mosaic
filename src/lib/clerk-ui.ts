import { publicEnv } from "@/lib/env";
import {
  clerkJSScriptUrl,
  clerkUIScriptUrl,
  loadClerkUIScript,
} from "@clerk/shared/loadClerkJsScript";
import type {
  ClerkUIConstructor,
  ClerkUIInstance,
  ComponentControls,
} from "@clerk/shared/ui";

declare global {
  interface Window {
    __internal_ClerkUICtor?: ClerkUIConstructor;
    /** Mosaic's React, registered by `@clerk/react` for Clerk's UI. */
    __clerkSharedModules?: unknown;
  }
}

/**
 * Clerk's `ui.shared.browser.js` renders with the page's React, which
 * `@clerk/react` registers when it loads, instead of downloading its own copy
 * (about 45 KB compressed). Clerk's loader always picks the standalone
 * bundle, so this names the shared one when React is registered.
 */
export function clerkUIUrl(shared = Boolean(window.__clerkSharedModules)) {
  const url = clerkUIScriptUrl(clerkScriptOptions);
  return shared
    ? url.replace(/\/ui\.browser\.js$/, "/ui.shared.browser.js")
    : url;
}

const clerkScriptOptions = { publishableKey: publicEnv.clerkPublishableKey };

/** The clerk-js script `ClerkProvider` loads. */
export function clerkJSUrl() {
  return clerkJSScriptUrl(clerkScriptOptions);
}

let ui: Promise<ClerkUIConstructor> | undefined;

/**
 * Downloads Clerk's UI bundle (its components, about 300 KB of JavaScript)
 * from the Frontend API, once. The sign-in and sign-up pages start it right
 * away; signed-in pages only when a Clerk component opens.
 */
export function loadClerkUI(): Promise<ClerkUIConstructor> {
  ui ??= loadClerkUIScript({
    ...clerkScriptOptions,
    __internal_clerkUIUrl: clerkUIUrl(),
  }).then(
    () => {
      const ctor = window.__internal_ClerkUICtor;
      if (!ctor) throw new Error("Clerk UI loaded without its constructor.");
      return ctor;
    },
    (error: unknown) => {
      // Let the next component that opens try again.
      ui = undefined;
      throw error;
    },
  );
  return ui;
}

type UpdatePropsParams = Parameters<ComponentControls["updateProps"]>[0];

function reportError(error: unknown) {
  console.error("Clerk UI failed to load:", error);
}

/**
 * Stands in for Clerk's UI, which clerk-js otherwise downloads with every
 * page that loads Clerk. Passed to `ClerkProvider` as `ui.ClerkUI`.
 *
 * clerk-js reaches its UI only through `ensureMounted()`. Calls that mount a
 * component pass a `preloadHint` and load the real UI at once. The others get
 * controls that defer it: closing or unmounting does nothing while nothing
 * can be open, option updates (`ClerkProvider` sends them on render) are kept
 * for when the UI loads, and anything that opens UI loads it.
 */
export class LazyClerkUI implements ClerkUIInstance {
  static version = "";
  readonly #args: ConstructorParameters<ClerkUIConstructor>;
  #instance: Promise<ClerkUIInstance> | undefined;
  #pendingProps: UpdatePropsParams | undefined;

  constructor(...args: ConstructorParameters<ClerkUIConstructor>) {
    this.#args = args;
  }

  get version() {
    return window.__internal_ClerkUICtor?.version ?? "";
  }

  ensureMounted(options?: {
    preloadHint?: string;
  }): Promise<ComponentControls> {
    if (!this.#instance && !options?.preloadHint) {
      return Promise.resolve(this.#deferredControls);
    }
    return this.#controls(options);
  }

  #controls(options?: { preloadHint?: string }) {
    this.#instance ??= loadClerkUI().then(
      (ClerkUI) => new ClerkUI(...this.#args),
      (error: unknown) => {
        this.#instance = undefined;
        throw error;
      },
    );
    return this.#instance
      .then((instance) => instance.ensureMounted(options))
      .then((controls) => {
        if (this.#pendingProps) {
          controls.updateProps(this.#pendingProps);
          this.#pendingProps = undefined;
        }
        return controls;
      });
  }

  /** Runs `call` on the real controls, loading the UI if `load` is set. */
  #forward(load: boolean, call: (controls: ComponentControls) => void) {
    if (!load && !this.#instance) return;
    this.#controls().then(call, reportError);
  }

  readonly #deferredControls: ComponentControls = {
    updateProps: (params) => {
      if (this.#instance) {
        this.#forward(false, (controls) => controls.updateProps(params));
      } else {
        this.#pendingProps = { ...this.#pendingProps, ...params };
      }
    },
    closeModal: (...args) => {
      this.#forward(false, (controls) => controls.closeModal(...args));
    },
    closeDrawer: (...args) => {
      this.#forward(false, (controls) => controls.closeDrawer(...args));
    },
    unmountComponent: (...args) => {
      this.#forward(false, (controls) => controls.unmountComponent(...args));
    },
    mountComponent: (...args) => {
      this.#forward(true, (controls) => controls.mountComponent(...args));
    },
    openModal: (...args) => {
      this.#forward(true, (controls) => controls.openModal(...args));
    },
    openDrawer: (...args) => {
      this.#forward(true, (controls) => controls.openDrawer(...args));
    },
    prefetch: (...args) => {
      this.#forward(true, (controls) => controls.prefetch(...args));
    },
    mountImpersonationFab: () => {
      this.#forward(true, (controls) => controls.mountImpersonationFab());
    },
    openProtectCheckModal: (props) => {
      // clerk-js skips the check when the UI has no modal for it.
      this.#forward(true, (controls) => {
        if (controls.openProtectCheckModal) {
          controls.openProtectCheckModal(props);
        } else {
          props.onResolved();
        }
      });
    },
  };
}
