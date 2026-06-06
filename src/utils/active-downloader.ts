/** Minimal interface for something that can be stopped gracefully */
export interface Stoppable {
  stop(): Promise<void>;
}

/** Module-level reference so SIGINT can call `.stop()` on the active downloader. */
let activeDownloader: Stoppable | null = null;

/** Prevents re-entry when the user smashes Ctrl+C multiple times. */
let stopping = false;

/**
 * Hard-kill all child processes of the current process (ffmpeg, HTTP, etc.)
 * using SIGKILL so no orphan survives.
 */
function killChildProcesses(): void {
  try {
    Bun.spawnSync(["pkill", "-9", "-P", String(process.pid)], {});
  } catch {
    // pkill not available on this platform — benign
  }
}

/**
 * Shared handler for both SIGINT and SIGTERM.
 *
 * `stop()` returns within 5 seconds (its own safety timeout), but the remux
 * ffmpeg spawned by tokwatchr has NO abort signal and may still be running.
 * We poll for child processes and wait up to 30s longer, so the .ts → .mp4
 * remux has time to finish. If the remux completes, the .mp4 is valid.
 * If the deadline expires, we SIGKILL whatever is left.
 */
async function handleSignal(signal: NodeJS.Signals): Promise<void> {
  if (stopping) return;
  stopping = true;

  process.stderr.write("\nStopping...\n");

  if (activeDownloader) {
    await activeDownloader.stop();
  }

  // stop() returned (≤5s). The remux ffmpeg might still be running.
  // Wait for child processes to finish (up to 30s) so the .mp4 is written.
  const deadline = Date.now() + 30_000;
  let dots = 0;
  while (Date.now() < deadline) {
    const pgrep = Bun.spawnSync(["pgrep", "-P", String(process.pid)], {});
    if (pgrep.exitCode !== 0) break; // No children — remux finished
    if (++dots % 10 === 0) process.stderr.write("."); // heartbeat every ~10s
    Bun.spawnSync(["sleep", "1"], {});
  }
  if (dots > 0) process.stderr.write(" done.\n");

  // Safety net: kill any remaining child processes
  killChildProcesses();

  process.exit(signal === "SIGINT" ? 130 : 143);
}

/**
 * Register global SIGINT and SIGTERM handlers that gracefully stop
 * the active downloader and kill any remaining child processes.
 */
export function registerSignalHandlers(): void {
  process.on("SIGINT", () => {
    void handleSignal("SIGINT");
  });
  process.on("SIGTERM", () => {
    void handleSignal("SIGTERM");
  });
}

/**
 * Set the active downloader reference for signal handling.
 * Pass `null` to clear after the downloader completes.
 * Accepts any object with a `stop()` method (full TikTokLiveDownloader
 * or a placeholder stub).
 */
export function setActiveDownloader(d: Stoppable | null): void {
  activeDownloader = d;
}

/**
 * Kill orphaned ffmpeg/child processes from previous interrupted runs.
 * Call at the start of each command before creating a new downloader.
 */
export function cleanupOrphanedProcesses(): void {
  killChildProcesses();
}
