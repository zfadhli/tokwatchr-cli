import { color, spinner } from "kowu-cli";
import { TikTokLiveDownloader } from "tokwatchr";
import type { DownloadResult, DownloadStats, StreamInfo } from "tokwatchr";
import type { WatchCliOptions } from "../types";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/**
 * Execute the `watch` command.
 *
 * Matches the pattern from tokwatchr's own examples:
 * - `.on()` events for progress/segment/complete
 * - Inline SIGINT handler calling `downloader.stop()` + `process.exit()`
 * - No shared state, no module-level indirection
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
  });

  const s = spinner(`Waiting for ${username} to go live...`).start();

  // ─── Wire events ───────────────────────────────────────

  downloader.on("start", (info: StreamInfo) => {
    s.text = `Recording ${info.title}...`;
  });

  downloader.on("progress", (stats: DownloadStats) => {
    s.text = `${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`;
  });

  downloader.on("segment", (result: DownloadResult, partNum: number) => {
    console.log(
      `  ${color.green("Segment")} ${partNum}: ${result.filePath}  ${color.dim(`(${formatBytes(result.sizeBytes)}, ${formatDuration(result.duration)})`)}`,
    );
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

  // ─── Start (waits for live) ────────────────────────────

  try {
    await downloader.start();
  } catch (error) {
    s.fail(String(error));
    throw error;
  } finally {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  }
}
