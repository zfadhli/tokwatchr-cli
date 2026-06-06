import { logger } from "kowu-cli";

/**
 * Base error for all CLI-level failures.
 * Separate from tokwatchr's own error classes.
 */
export class CliError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CliError";
  }
}

/** User pressed Ctrl+C or cancelled a prompt */
export class UserCancelledError extends CliError {
  constructor() {
    super("Cancelled");
    this.name = "UserCancelledError";
  }
}

/** Invalid or missing configuration */
export class ConfigError extends CliError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ConfigError";
  }
}

/**
 * Render a caught error to stderr and exit with a non-zero code.
 * Tokwatchr errors are rendered with their own messages; unexpected
 * errors include the stack trace in debug mode.
 */
export function handleFatalError(error: unknown): never {
  if (error instanceof CliError) {
    logger.error(error.message);
    process.exit(1);
  }

  // tokwatchr error classes
  if (error instanceof Error) {
    switch (error.name) {
      case "UserOfflineError":
        logger.error("User is not live. Use `watch` to wait for them to go live.");
        break;
      case "RoomResolveError":
        logger.error("Could not find the user's livestream room.");
        break;
      case "StreamFetchError":
        logger.error("Could not fetch stream info. Check the username and try again.");
        break;
      case "DownloadFailedError":
        logger.error(`Download failed: ${error.message}`);
        break;
      case "FfmpegError":
        logger.error(`ffmpeg error: ${error.message}. Install ffmpeg or use --no-ffmpeg.`);
        break;
      case "AbortError":
        logger.info("Aborted.");
        break;
      default:
        logger.error(`Unexpected error: ${error.message}`);
        if (process.env.DEBUG) {
          console.error(error.stack);
        }
        break;
    }
  } else {
    logger.error(String(error));
  }

  process.exit(1);
}
