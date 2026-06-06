import { color, spinner } from "kowu-cli";
import { TikTokLiveDownloader, UserOfflineError } from "tokwatchr";
import type { DownloadResult, DownloadStats, StreamInfo } from "tokwatchr";
import type { DownloadCliOptions } from "../types";
import { cleanupOrphanedProcesses, setActiveDownloader } from "../utils/active-downloader";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/**
 * Execute the `download` command.
 *
 * Uses `startRecording()` (fails if offline) with events wired via `.on()`.
 * On `UserOfflineError` the command stops with a suggestion to use `watch`.
 */
export async function executeDownload(
  username: string,
  options: DownloadCliOptions,
): Promise<void> {
  cleanupOrphanedProcesses();

  // Placeholder before constructor (may block up to 5s on spawnSync)
  const placeholder = { stop: () => Promise.resolve() };
  setActiveDownloader(placeholder);

  const downloader = new TikTokLiveDownloader(username, {
    output: options.output,
    quality: options.quality,
    format: options.format,
    proxyUrl: options.proxy,
    useFfmpeg: options.ffmpeg,
  });

  const s = spinner("Resolving room...").start();
  setActiveDownloader(downloader);

  // ─── Wire events ───────────────────────────────────────

  downloader.on("start", (info: StreamInfo) => {
    s.text = `Recording ${info.title}...`;
  });

  downloader.on("progress", (stats: DownloadStats) => {
    s.text = `${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`;
  });

  downloader.on("complete", (results: DownloadResult[]) => {
    for (const r of results) {
      console.log(
        `  ${color.green("Saved:")} ${r.filePath}  ${color.dim(`(${formatBytes(r.sizeBytes)}, ${formatDuration(r.duration)})`)}`,
      );
    }
    const totalMB = results.reduce((sum, r) => sum + r.sizeMB, 0);
    s.succeed(`Done — ${results.length} segment(s), ${totalMB.toFixed(1)}MB total`);
  });

  // ─── Start ──────────────────────────────────────────────

  try {
    await downloader.startRecording();
  } catch (error) {
    if (error instanceof UserOfflineError) {
      s.fail("User is not live. Use `watch` to wait for them to go live.");
      process.exit(1);
    }
    s.fail(String(error));
    throw error;
  } finally {
    setActiveDownloader(null);
  }
}
