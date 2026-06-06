import pc from "picocolors";
import { TikTokLiveDownloader } from "tokwatchr";
import type { DownloadResult, DownloadStats, StreamInfo } from "tokwatchr";
import type { WatchCliOptions } from "../types";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/**
 * Execute the `watch` command.
 *
 * Uses plain console output (no spinner) so terminal stays in cooked
 * mode and SIGINT flows normally through process.on().
 */
export async function executeWatch(username: string, options: WatchCliOptions): Promise<void> {
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

  console.error(`Waiting for ${username} to go live...`);

  // ─── Wire events ───────────────────────────────────────

  downloader.on("start", (info: StreamInfo) => {
    console.error(
      `\n${pc.green("Live!")} ${info.title}  ${pc.dim(`(${info.viewerCount} viewers)`)}`,
    );
    console.error("Recording...");
  });

  downloader.on("progress", (stats: DownloadStats) => {
    const line = `${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`;
    process.stderr.write(`\r  ${line}  `);
  });

  downloader.on("segment", (result: DownloadResult, partNum: number) => {
    process.stderr.write("\n");
    console.error(
      `  ${pc.green("Segment")} ${partNum}: ${result.filePath}  ${pc.dim(`(${formatBytes(result.sizeBytes)}, ${formatDuration(result.duration)})`)}`,
    );
  });

  downloader.on("complete", (results: DownloadResult[]) => {
    process.stderr.write("\n");
    for (const r of results) {
      console.error(
        `  ${pc.green("Saved:")} ${r.filePath}  ${pc.dim(`(${formatBytes(r.sizeBytes)}, ${formatDuration(r.duration)})`)}`,
      );
    }
    const totalMB = results.reduce((sum, r) => sum + r.sizeMB, 0);
    console.error(`  Done — ${results.length} segment(s), ${totalMB.toFixed(1)}MB total`);
  });

  // ─── Start (waits for live) ────────────────────────────

  try {
    await downloader.start();
  } catch (error) {
    if (sigintHandled) {
      // SIGINT handler is managing shutdown — don't double-exit
      return;
    }
    console.error(pc.red("✖"), String(error));
    throw error;
  }
}
