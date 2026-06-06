import pc from "picocolors";
import ora from "ora";
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
 */
export async function executeWatch(username: string, options: WatchCliOptions): Promise<void> {
  console.error("Starting...");

  // ─── SIGINT / SIGTERM (registered BEFORE any async work) ─────

  let sigintHandled = false;

  const onSignal = async () => {
    sigintHandled = true;
    console.log("\n\n  Stopping...");
    await downloader.stop();
    process.exit(0);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

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

  const s = ora(`Waiting for ${username} to go live...`).start();

  // ─── Wire events ───────────────────────────────────────

  downloader.on("start", (info: StreamInfo) => {
    s.text = `Recording ${info.title}...`;
  });

  downloader.on("progress", (stats: DownloadStats) => {
    s.text = `${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`;
  });

  downloader.on("segment", (result: DownloadResult, partNum: number) => {
    console.log(
      `  ${pc.green("Segment")} ${partNum}: ${result.filePath}  ${pc.dim(`(${formatBytes(result.sizeBytes)}, ${formatDuration(result.duration)})`)}`,
    );
  });

  downloader.on("complete", (results: DownloadResult[]) => {
    for (const r of results) {
      console.log(
        `  ${pc.green("Saved:")} ${r.filePath}  ${pc.dim(`(${formatBytes(r.sizeBytes)}, ${formatDuration(r.duration)})`)}`,
      );
    }
    const totalMB = results.reduce((sum, r) => sum + r.sizeMB, 0);
    s.succeed(`Done — ${results.length} segment(s), ${totalMB.toFixed(1)}MB total`);
  });

  // ─── Start (waits for live) ────────────────────────────

  try {
    await downloader.start();
  } catch (error) {
    if (sigintHandled) {
      // SIGINT handler is managing shutdown — don't double-exit
      return;
    }
    s.fail(String(error));
    throw error;
  }
}
