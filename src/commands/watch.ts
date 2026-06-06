import { color, spinner } from "kowu-cli";
import type { DownloadResult, DownloadStats, StreamInfo } from "tokwatchr";
import { TikTokLiveDownloader } from "tokwatchr";
import type { WatchCliOptions } from "../types";
import { setActiveDownloader } from "../utils/active-downloader";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/**
 * Execute the `watch` command.
 *
 * Uses tokwatchr's `TikTokLiveDownloader` with a manual ora spinner.
 * The spinner transitions through phases:
 *   "Waiting for {username}..."  →  "Recording..."  →  success/fail
 *
 * On SIGINT, the shared `active-downloader` handler calls `stop()`,
 * which remuxes any pending segment before exit.
 */
export async function executeWatch(username: string, options: WatchCliOptions): Promise<void> {
  // Construct the downloader first — the constructor may block synchronously
  // for up to 5s detecting ffmpeg via spawnSync. Starting the spinner after
  // ensures it doesn't lose animation frames during the stall.
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

  const s = spinner(`Waiting for ${username} to go live...`).start();

  setActiveDownloader(downloader);

  try {
    const result: DownloadResult = await downloader.start();

    s.succeed(
      `${color.green("Saved:")} ${result.filePath}  ${color.dim(`(${formatBytes(result.sizeBytes)}, ${formatDuration(result.duration)})`)}`,
    );
  } catch (error) {
    s.fail(String(error));
    throw error;
  } finally {
    setActiveDownloader(null);
  }
}
