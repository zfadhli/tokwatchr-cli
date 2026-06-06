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
 */
export async function executeDownload(
  username: string,
  options: DownloadCliOptions,
): Promise<void> {
  console.error("Starting...");

  // ─── SIGINT / SIGTERM (registered BEFORE any async work) ─────

  const onSignal = async () => {
    console.error("\nStopping...");
    // Kill existing child processes before stop() so they don't interfere
    try {
      Bun.spawnSync(["pkill", "-9", "-P", String(process.pid)], {});
    } catch {}
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
  }
}
