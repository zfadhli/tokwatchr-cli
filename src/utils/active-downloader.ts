/** Minimal interface for something that can be stopped gracefully */
export interface Stoppable {
  stop(): Promise<void>;
}

/** Module-level reference so SIGINT can call `.stop()` on the active downloader. */
let activeDownloader: Stoppable | null = null;

/**
 * Kill all child processes of the current process (ffmpeg, HTTP, etc.).
 * This is a safety net for when tokwatchr's own `stop()` doesn't fully
 * clean up subprocesses.
 */
function killChildProcesses(): void {
  try {
    Bun.spawnSync(["pkill", "-P", String(process.pid)], {});
  } catch {
    // pkill not available on this platform — benign
  }
}

/**
 * Register a global SIGINT handler that gracefully stops the active
 * downloader and kills any remaining child processes before exiting.
 */
export function registerSigintHandler(): void {
  process.on("SIGINT", async () => {
    if (activeDownloader) {
      await activeDownloader.stop();
    }
    killChildProcesses();
    process.exit(130);
  });
}

/**
 * Set the active downloader reference for SIGINT handling.
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
