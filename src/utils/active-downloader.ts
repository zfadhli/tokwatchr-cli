import type { TikTokLiveDownloader } from "tokwatchr";

/** Module-level reference so SIGINT can call `.stop()` on the active downloader. */
let activeDownloader: TikTokLiveDownloader | null = null;

/**
 * Register a global SIGINT handler that gracefully stops
 * an active TikTokLiveDownloader, remuxing any pending segments.
 */
export function registerSigintHandler(): void {
  process.on("SIGINT", async () => {
    if (activeDownloader) {
      await activeDownloader.stop();
    }
    process.exit(0);
  });
}

/**
 * Set the active downloader reference for SIGINT handling.
 * Pass `null` to clear after the downloader completes.
 */
export function setActiveDownloader(d: TikTokLiveDownloader | null): void {
  activeDownloader = d;
}
