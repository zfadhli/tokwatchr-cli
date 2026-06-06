import { color, logSymbols } from "kowu-cli";
import { TikTokLiveDownloader } from "tokwatchr";
import type { DownloadResult, DownloadStats, StreamInfo } from "tokwatchr";
import type { WatchCliOptions } from "../types";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/** Shared reference so SIGINT can call `.stop()` */
let activeDownloader: TikTokLiveDownloader | null = null;

/**
 * Register a global SIGINT handler that gracefully stops
 * an active TikTokLiveDownloader.
 */
export function registerSigintHandler(): void {
  process.on("SIGINT", async () => {
    if (activeDownloader) {
      // Ora spinner will be stopped by kowu-cli's auto-spinner
      // when the action rejects. We just need to tell the
      // downloader to stop.
      await activeDownloader.stop();
    }
    process.exit(0);
  });
}

/**
 * Execute the `watch` command.
 *
 * Uses tokwatchr's `TikTokLiveDownloader` with wait-for-live,
 * segmenting, and progress events.
 */
export async function executeWatch(username: string, options: WatchCliOptions): Promise<void> {
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
      console.log(
        `  ${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`,
      );
    },
    onStart(info: StreamInfo) {
      console.log(
        `\n${logSymbols.success} ${color.green("Live!")} ${info.title}  ${color.dim(`(${info.viewerCount} viewers)`)}`,
      );
    },
  });

  activeDownloader = downloader;

  try {
    const result: DownloadResult = await downloader.start();

    console.log(
      `${logSymbols.success} ${color.green("Saved:")} ${result.filePath}  ${color.dim(`(${formatBytes(result.sizeBytes)}, ${formatDuration(result.duration)})`)}`,
    );
  } finally {
    activeDownloader = null;
  }
}
