# Changelog

## [0.3.0] - 2026-06-07

### Added

- Persistent watch mode — the `watch` command now loops across multiple
  livestreams instead of exiting after the first stream ends
- Transient error recovery — network timeouts, SSL failures, and other
  transient errors during the waiting phase are retried after a 10-second
  delay instead of crashing

### Fixed

- Show tokwatchr's actual error message for ffmpeg errors instead of
  misleading "Install ffmpeg or use --no-ffmpeg." message

[0.3.0]: https://github.com/zfadhli/tokwatchr-cli/compare/v0.2.1...v0.3.0
