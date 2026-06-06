import { color, spinner } from "kowu-cli";
import { download as tokWatchrDownload } from "tokwatchr";
import type { DownloadStats } from "tokwatchr";
import type { DownloadCliOptions } from "../types";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/**
 * Execute the `download` command.
 *
 * Uses tokwatchr's `download()` function with a manual ora spinner
 * that live-updates with progress stats.
 */
export async function executeDownload(
  username: string,
  options: DownloadCliOptions,
): Promise<void> {
  const s = spinner("Resolving room...").start();

  try {
    const result = await tokWatchrDownload(username, {
      output: options.output,
      quality: options.quality,
      format: options.format,
      proxyUrl: options.proxy,
      useFfmpeg: options.ffmpeg,
      onProgress(stats: DownloadStats) {
        s.text = `${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`;
      },
    });

    s.succeed(
      `${color.green("Saved:")} ${result.filePath}  ${color.dim(`(${formatBytes(result.sizeBytes)}, ${formatDuration(result.duration)})`)}`,
    );
  } catch (error) {
    s.fail(String(error));
    throw error;
  }
}
