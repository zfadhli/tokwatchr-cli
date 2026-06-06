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
 */
export async function executeWatch(username: string, options: WatchCliOptions): Promise<void> {
  console.error("Starting...");

  // ─── SIGINT / SIGTERM (registered BEFORE any async work) ─────

  let sigintHandled = false;

  const onSignal = async () => {
    sigintHandled = true;
    console.error("\nStopping...");
    // stop() first: gracefully aborts the download and starts the remux.
    // It has its own ≤5s safety timeout.
    await downloader.stop();
    // stop() returns in ≤5s. The remux ffmpeg might still be converting
    // the .ts → .mp4 (it has no abort signal). Wait up to 15s for it.
    console.error("Remuxing... please wait.");
    let dots = 0;
    const interval = setInterval(() => {
      console.error(".");
      if (++dots >= 5) clearInterval(interval);
    }, 3_000);
    await new Promise((r) => setTimeout(r, 15_000));
    clearInterval(interval);
    // Kill any surviving child processes
    try {
      Bun.spawnSync(["pkill", "-9", "-P", String(process.pid)], {});
    } catch {}
    process.exit(130);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  // Kill orphan child processes from previous interrupted runs
  try {
    Bun.spawnSync(["pkill", "-9", "-P", String(process.pid)], {});
  } catch {
    // pkill not available — benign
  }

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
