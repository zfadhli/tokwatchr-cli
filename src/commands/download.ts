import { color, spinner } from "kowu-cli";
import { TikTokLiveDownloader, UserOfflineError } from "tokwatchr";
import type { DownloadResult, DownloadStats, StreamInfo } from "tokwatchr";
import type { DownloadCliOptions } from "../types";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/**
 * Execute the `download` command.
 *
 * Matches the pattern from tokwatchr's own examples:
 * - `.on()` events for progress/complete
 * - Inline SIGINT handler calling `downloader.stop()` + `process.exit()`
 * - No shared state, no module-level indirection
 */
export async function executeDownload(
  username: string,
  options: DownloadCliOptions,
): Promise<void> {
  const downloader = new TikTokLiveDownloader(username, {
    output: options.output,
    quality: options.quality,
    format: options.format,
    proxyUrl: options.proxy,
    useFfmpeg: options.ffmpeg,
  });

  const s = spinner("Resolving room...").start();

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

  // ─── SIGINT / SIGTERM (inline, matching tokwatchr examples) ──

  const onSignal = async () => {
    s.text = "Stopping...";
    await downloader.stop();
    process.exit(130);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

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
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  }
}
