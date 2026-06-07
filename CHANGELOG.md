# Changelog

## [0.3.3] - 2026-06-07

### Fixed

- Upgrade tokwatchr to v0.6.5 — removes the 5-second timeout from
  `stop()`, ensuring the last segment always finishes remuxing on
  Ctrl+C instead of being killed mid-conversion

[0.3.3]: https://github.com/zfadhli/tokwatchr-cli/compare/v0.3.2...v0.3.3

## [0.3.2] - 2026-06-07

### Fixed

- CLI `--version` now reads from `package.json` instead of a hardcoded
  string — previously always showed `0.1.0` regardless of the published
  version

[0.3.2]: https://github.com/zfadhli/tokwatchr-cli/compare/v0.3.1...v0.3.2

## [0.3.1] - 2026-06-07

### Changed

- Upgrade tokwatchr from v0.6.3 to v0.6.4 — fixes abort controller not
  being reset between `start()` calls, enabling persistent watch loop

[0.3.1]: https://github.com/zfadhli/tokwatchr-cli/compare/v0.3.0...v0.3.1

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
