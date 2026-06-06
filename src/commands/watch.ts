import pc from "picocolors";
import type { DownloadResult, DownloadStats, StreamInfo, WaitingInfo } from "tokwatchr";
import { TikTokLiveDownloader } from "tokwatchr";
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
    console.log(`\n\n  ${pc.red(`Stopping...`)}`);
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
    maxDuration: options.maxDuration ? options.maxDuration * 60 : undefined,
    maxSegmentDuration: options.segmentDuration ? options.segmentDuration * 60 : undefined,
    checkInterval: options.interval ? options.interval * 60_000 : undefined,
  });

  // ─── Wire events ───────────────────────────────────────

  downloader.on("start", (info: StreamInfo) => {
    console.error(`\n${pc.blue(`@${info.username}`)}`);
    console.log(`  ${pc.green("Recording...")}`);
  });

  // Sync a local timestamp from tokwatchr's waiting event (fires each poll cycle)
  let waitingStart = Date.now();
  downloader.on("waiting", (info: WaitingInfo) => {
    waitingStart = Date.now() - info.elapsed * 1000;
  });

  downloader.on("progress", (stats: DownloadStats) => {
    const line = `${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`;
    process.stderr.write(`\r  ${line}  `);
  });

  downloader.on("segment", (result: DownloadResult, partNum: number) => {
    process.stderr.write("\n");
    console.log(
      `  ${pc.green("Segment")} ${partNum}: ${result.filePath}  ${pc.dim(`(${formatBytes(result.sizeBytes)}, ${formatDuration(result.duration)})`)}`,
    );
  });

  downloader.on("complete", (results: DownloadResult[]) => {
    process.stderr.write("\n");
    for (const r of results) {
      console.log(
        `  ${pc.green("Saved:")} ${r.filePath}  ${pc.dim(`(${formatBytes(r.sizeBytes)}, ${formatDuration(r.duration)})`)}`,
      );
    }
    const totalMB = results.reduce((sum, r) => sum + r.sizeMB, 0);
    console.log(`  Done — ${results.length} segment(s), ${totalMB.toFixed(1)}MB total`);
  });

  // ─── Start (waits for live) ────────────────────────────

  console.log(`${pc.dim("Waiting for ")}${pc.blue(username)}${pc.dim(" to go live...")}`);

  // 1-second local timer so the display updates between tokwatchr's poll cycles
  const waitingTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - waitingStart) / 1000);
    process.stderr.write(`\r  ${pc.dim(`Waiting... ${formatDuration(elapsed)}`)}  `);
  }, 1_000);

  try {
    await downloader.start();
  } catch (error) {
    if (sigintHandled) {
      // SIGINT handler is managing shutdown — don't double-exit
      return;
    }
    console.error(pc.red("✖"), String(error));
    throw error;
  } finally {
    clearInterval(waitingTimer);
  }
}
