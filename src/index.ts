#! /usr/bin/env bun

import { program } from "kowu-cli";
import { executeDownload } from "./commands/download";
import { executeWatch, registerSigintHandler } from "./commands/watch";
import type { DownloadCliOptions, WatchCliOptions } from "./types";
import { handleFatalError } from "./utils/errors";

// Register global SIGINT handler for graceful stop
registerSigintHandler();

// -------------------------------------------------------
// Program
// -------------------------------------------------------
const cli = program("tokwatchr");

// -------------------------------------------------------
// download  —  one-shot fire-and-forget
// -------------------------------------------------------
cli
  .command("download <username>", "Download a TikTok livestream (user must be live)")
  .option("-o, --output <dir>", "Output directory [cwd]")
  .option("-q, --quality <quality>", "Quality: best|worst|fullhd1|hd1|sd2|sd1 [best]")
  .option("-f, --format <format>", "Format: mp4|mkv|ts|flv [mp4]")
  .option("--proxy <url>", "HTTP/SOCKS proxy URL")
  .option("--no-ffmpeg", "Skip ffmpeg processing (output .flv)")
  .example("tokwatchr download officialgeilegisela")
  .example("tokwatchr download tv_asahi_news -o ./vods -q hd1")
  .example("tokwatchr download username --proxy socks5://localhost:1080")
  .action(async (username: string, options: DownloadCliOptions) => {
    try {
      await executeDownload(username, options);
    } catch (error) {
      handleFatalError(error);
    }
  });

// -------------------------------------------------------
// watch  —  wait for live, then record with events
// -------------------------------------------------------
cli
  .command("watch <username>", "Wait for a user to go live, then start recording")
  .option("-o, --output <dir>", "Output directory [cwd]")
  .option("-q, --quality <quality>", "Quality: best|worst|fullhd1|hd1|sd2|sd1 [best]")
  .option("-f, --format <format>", "Format: mp4|mkv|ts|flv [mp4]")
  .option("-d, --max-duration <seconds>", "Max recording duration in seconds")
  .option("-s, --segment-duration <seconds>", "Split into N-second segments")
  .option("-i, --interval <ms>", "Poll interval in ms for wait mode [30000]")
  .option("--proxy <url>", "HTTP/SOCKS proxy URL")
  .option("--no-ffmpeg", "Skip ffmpeg processing (output .flv)")
  .example("tokwatchr watch username")
  .example("tokwatchr watch username -s 600 -d 7200")
  .example("tokwatchr watch username -i 60000")
  .action(async (username: string, options: WatchCliOptions) => {
    try {
      await executeWatch(username, options);
    } catch (error) {
      handleFatalError(error);
    }
  });

// -------------------------------------------------------
// Parse
// -------------------------------------------------------
cli.help();
cli.version("0.1.0");
cli.parse();
