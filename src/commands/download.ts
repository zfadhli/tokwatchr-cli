import { color, spinner } from "kowu-cli";
import { TikTokLiveDownloader } from "tokwatchr";
import type { DownloadResult, DownloadStats, StreamInfo } from "tokwatchr";
import type { DownloadCliOptions } from "../types";
import { setActiveDownloader } from "../utils/active-downloader";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/**
 * Execute the `download` command.
 *
 * Uses tokwatchr's `TikTokLiveDownloader.startRecording()` so that:
 * - On normal completion, the `.ts` segment is remuxed to the target format.
 * - On SIGINT, `stop()` remuxes any pending segment before exit.
 */
export async function executeDownload(
  username: string,
  options: DownloadCliOptions,
): Promise<void> {
  // Construct the downloader first — the constructor may block synchronously
  // for up to 5s detecting ffmpeg via spawnSync. Starting the spinner after
  // ensures it doesn't lose animation frames during the stall.
  const downloader = new TikTokLiveDownloader(username, {
    output: options.output,
    quality: options.quality,
    format: options.format,
    proxyUrl: options.proxy,
    useFfmpeg: options.ffmpeg,
    onStart(info: StreamInfo) {
      s.text = `Recording ${info.title}...`;
    },
    onProgress(stats: DownloadStats) {
      s.text = `${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`;
    },
  });

  const s = spinner("Resolving room...").start();

  setActiveDownloader(downloader);

  try {
    const result: DownloadResult = await downloader.startRecording();

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
