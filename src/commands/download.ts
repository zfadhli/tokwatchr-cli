import pc from "picocolors";
import { TikTokLiveDownloader, UserOfflineError } from "tokwatchr";
import type { DownloadResult, DownloadStats, StreamInfo } from "tokwatchr";
import type { DownloadCliOptions } from "../types";
import { formatBytes, formatDuration, formatSpeed } from "../utils/format";

/**
 * Execute the `download` command.
 *
 * Uses plain console output (no spinner) so terminal stays in cooked
 * mode and SIGINT flows normally through process.on().
 */
export async function executeDownload(
  username: string,
  options: DownloadCliOptions,
): Promise<void> {
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
  });

  console.error("Resolving room...");

  // ─── Wire events ───────────────────────────────────────

  downloader.on("start", (info: StreamInfo) => {
    console.error(`Recording ${info.title}...`);
  });

  downloader.on("progress", (stats: DownloadStats) => {
    const line = `${formatBytes(stats.downloadedBytes)} @ ${formatSpeed(stats.speed)}  [${formatDuration(stats.duration)}]`;
    process.stderr.write(`\r  ${line}  `);
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

  // ─── Start ──────────────────────────────────────────────

  try {
    await downloader.startRecording();
  } catch (error) {
    if (sigintHandled) {
      // SIGINT handler is managing shutdown — don't double-exit
      return;
    }
    if (error instanceof UserOfflineError) {
      console.error(pc.red("✖"), "User is not live. Use `watch` to wait for them to go live.");
      process.exit(1);
    }
    console.error(pc.red("✖"), String(error));
    throw error;
  }
}
