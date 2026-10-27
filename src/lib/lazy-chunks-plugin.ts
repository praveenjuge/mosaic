import { relative } from "node:path";
import type { Plugin } from "vite";

const virtualId = "virtual:mosaic-lazy-chunks";
const resolvedId = `\0${virtualId}`;

/**
 * Maps each lazily imported module in `src/` (like the dashboard page) to the
 * client files it needs: its chunk and every chunk that chunk imports, less
 * the entry chunk's own imports, which Start already preloads. The
 * server reads the map from `virtual:mosaic-lazy-chunks` to send
 * `modulepreload` links for the lazy components a page renders (see
 * `preloadableLazy`), so the browser fetches them with the page's own
 * scripts instead of after hydration starts. TanStack Start's manifest only
 * covers route chunks.
 *
 * Start builds the client before the server, and the plugin instance is
 * shared, so the client build fills the map the server build reads. The
 * client and development get an empty map.
 */
export function lazyChunks(): Plugin {
  const chunks: Record<string, string[]> = {};
  let root = process.cwd();
  let base = "/";

  return {
    name: "mosaic:lazy-chunks",
    configResolved(config) {
      root = config.root;
      base = config.base;
    },
    resolveId(id) {
      return id === virtualId ? resolvedId : undefined;
    },
    load(id) {
      if (id !== resolvedId) return;
      const map = this.environment.name === "client" ? {} : chunks;
      return `export default ${JSON.stringify(map)};`;
    },
    generateBundle(_options, bundle) {
      if (this.environment.name !== "client") return;
      const graph = (fileName: string, files = new Set<string>()) => {
        if (files.has(fileName)) return files;
        files.add(fileName);
        const imported = bundle[fileName];
        if (imported?.type === "chunk") {
          for (const name of imported.imports) graph(name, files);
        }
        return files;
      };
      const entryFiles = new Set<string>();
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.isEntry) {
          graph(chunk.fileName, entryFiles);
        }
      }

      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk" || !chunk.isDynamicEntry) continue;
        const source = chunk.facadeModuleId;
        if (!source) continue;
        const id = relative(root, source).replaceAll("\\", "/");
        // Route chunks (`?tsr-split=`) are already in Start's manifest.
        if (!id.startsWith("src/") || id.includes("?")) continue;

        chunks[id] = [...graph(chunk.fileName)]
          .filter((fileName) => !entryFiles.has(fileName))
          .map((fileName) => `${base}${fileName}`);
      }
    },
  };
}
