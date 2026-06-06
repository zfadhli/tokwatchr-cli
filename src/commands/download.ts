import { color, logSymbols } from "kowu-cli";
import { download as tokWatchrDownload } from "tokwatchr";
import type { DownloadStats } from "tokwatchr";
import type { DownloadCliOptions } from "../types";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/**
 * Execute the `download` command.
 *
 * Uses tokwatchr's `download()` function for a one-shot
 * fire-and-forget download. The caller is responsible for
 * wrapping this in a spinner.
 */
export async function executeDownload(
  username: string,
  options: DownloadCliOptions,
): Promise<void> {
  const result = await tokWatchrDownload(username, {
    output: options.output,
    quality: options.quality,
    format: options.format,
    proxyUrl: options.proxy,
    useFfmpeg: options.ffmpeg,
    onProgress(stats: DownloadStats) {
      console.log(
        `  ${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`,
      );
    },
  });

  console.log(
    `\n${logSymbols.success} ${color.green("Saved:")} ${result.filePath}  ${color.dim(`(${formatBytes(result.sizeBytes)}, ${formatDuration(result.duration)})`)}`,
  );
}
