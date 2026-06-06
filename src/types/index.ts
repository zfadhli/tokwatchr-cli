/** Options shared by both `download` and `watch` commands */
export interface SharedCliOptions {
  /** Output directory (default: process.cwd()) */
  output?: string;
  /** Quality preference */
  quality?: "best" | "worst" | "fullhd1" | "hd1" | "sd2" | "sd1";
  /** Output container format */
  format?: "mp4" | "mkv" | "ts" | "flv";
  /** HTTP/SOCKS proxy URL */
  proxy?: string;
  /** Whether to use ffmpeg (default: true if found on PATH) */
  ffmpeg: boolean;
}

/** Options specific to the `download` command */
export interface DownloadCliOptions extends SharedCliOptions {}

/** Options specific to the `watch` command */
export interface WatchCliOptions extends SharedCliOptions {
  /** Max recording duration in seconds (default: Infinity) */
  maxDuration?: number;
  /** Segment duration in seconds */
  segmentDuration?: number;
  /** Poll interval in ms for wait-for-live mode (default: 30000) */
  interval?: number;
}
