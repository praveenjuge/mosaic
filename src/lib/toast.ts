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

type Sonner = typeof import("sonner").toast;

function show(display: (sonner: Sonner) => void) {
  void Promise.all([import("sonner"), toasterReady]).then(([{ toast }]) => {
    display(toast);
  });
}

export const toast = {
  success: (message: string) => show((sonner) => sonner.success(message)),
  error: (message: string) => show((sonner) => sonner.error(message)),
  info: (message: string) => show((sonner) => sonner.info(message)),
};
