import { color, spinner } from "kowu-cli";
import { TikTokLiveDownloader } from "tokwatchr";
import type { DownloadResult, DownloadStats, StreamInfo } from "tokwatchr";
import type { WatchCliOptions } from "../types";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/** Shared reference so SIGINT can call `.stop()` */
let activeDownloader: TikTokLiveDownloader | null = null;

/**
 * Register a global SIGINT handler that gracefully stops
 * an active TikTokLiveDownloader. The manual spinner will
 * persist during cleanup.
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
 * Execute the `watch` command.
 *
 * Uses tokwatchr's `TikTokLiveDownloader` with a manual ora spinner.
 * The spinner transitions through phases:
 *   "Waiting for {username}..."  →  "Recording..."  →  success/fail
 */
export async function executeWatch(username: string, options: WatchCliOptions): Promise<void> {
  const s = spinner(`Waiting for ${username} to go live...`).start();

  const downloader = new TikTokLiveDownloader(username, {
    output: options.output,
    quality: options.quality,
    format: options.format,
    proxyUrl: options.proxy,
    useFfmpeg: options.ffmpeg,
    maxDuration: options.maxDuration,
    maxSegmentDuration: options.segmentDuration,
    checkInterval: options.interval,
    onProgress(stats: DownloadStats) {
      s.text = `${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`;
    },
    onStart(info: StreamInfo) {
      s.text = `Recording ${info.title}...`;
    },
  });

  activeDownloader = downloader;

  try {
    const result: DownloadResult = await downloader.start();

    s.succeed(
      `${color.green("Saved:")} ${result.filePath}  ${color.dim(`(${formatBytes(result.sizeBytes)}, ${formatDuration(result.duration)})`)}`,
    );
  } catch (error) {
    s.fail(String(error));
    throw error;
  } finally {
    activeDownloader = null;
  }
}
