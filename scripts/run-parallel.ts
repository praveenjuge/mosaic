/**
 * Runs package scripts at the same time and prints each one's output as a
 * block once it finishes, so logs don't interleave. Exits non-zero if any
 * script fails. Used by `bun run check:fast` and `bun run check`:
 *   bun scripts/run-parallel.ts lint:check typecheck test
 */

export {};

const scripts = process.argv.slice(2);
if (scripts.length === 0) {
  console.error("Usage: bun scripts/run-parallel.ts SCRIPT [SCRIPT...]");
  process.exit(2);
}

const results = await Promise.all(
  scripts.map(async (script) => {
    const startedAt = performance.now();
    const child = Bun.spawn(["bun", "run", script], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? "1" },
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
    const status = exitCode === 0 ? "✓" : `✗ (exit ${exitCode})`;
    console.log(`\n── ${script} ${status} ${seconds}s ──`);
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    return { script, exitCode };
  }),
);

const failed = results.filter(({ exitCode }) => exitCode !== 0);
if (failed.length > 0) {
  console.error(`\nFailed: ${failed.map(({ script }) => script).join(", ")}`);
  process.exit(1);
}
