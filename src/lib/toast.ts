/**
 * `toast.success/error/info` without sonner in the page's JavaScript. The
 * dashboard mounts the lazy `Toaster` after it hydrates; each toast waits
 * for sonner and that `Toaster`, which only shows toasts created after it
 * mounts.
 */

let markReady: () => void = () => {};
const toasterReady = new Promise<void>((resolve) => {
  markReady = resolve;
});

/** Called by `Toaster` once it has mounted. */
export function toasterMounted() {
  markReady();
}

function show(kind: "success" | "error" | "info", message: string) {
  void Promise.all([import("sonner"), toasterReady]).then(([{ toast }]) => {
    toast[kind](message);
  });
}

export const toast = {
  success: (message: string) => show("success", message),
  error: (message: string) => show("error", message),
  info: (message: string) => show("info", message),
};
