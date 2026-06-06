# tokwatchr-cli

**Download TikTok livestreams from the command line.**

A CLI wrapper around [tokwatchr](https://github.com/zfadhli/tokwatchr), the TypeScript library for downloading TikTok livestreams. Supports one-shot downloads, persistent watch mode, automatic quality selection, crash-safe intermediate files, and EBU R128 audio normalization.

---

## Features

- **Two modes**: `download` for one-shot (user must be live), `watch` for persistent polling that waits for the user to go live
- **Automatic quality selection**: picks the best available stream (1080p → 720p → 540p → 360p)
- **Crash-safe intermediate**: saves stream as MPEG-TS first (playable even if truncated), then remuxes to MP4 with ffmpeg
- **Audio normalization**: EBU R128 loudnorm (equivalent to `ffmpeg-normalize --preset streaming-video`)
- **Segment mode**: split long streams into configurable parts
- **Proxy support**: HTTP and SOCKS proxies via `--proxy`
- **Graceful shutdown**: Ctrl+C stops the recording and remuxes the pending segment

---

## Install

```bash
# via npm
npm install -g tokwatchr-cli

# via bun
bun add -g tokwatchr-cli

# run directly
npx tokwatchr-cli download username
```

> [!TIP]
> **System requirement**: [FFmpeg](https://ffmpeg.org) must be installed for audio normalization and `.mp4` output. Without it, the tool falls back to raw FLV download.  
> On macOS: `brew install ffmpeg`  
> On Ubuntu: `sudo apt install ffmpeg`  
> On Windows: `winget install ffmpeg` or `choco install ffmpeg`

---

## Quick Start

### Download a livestream (one-shot)

```bash
tokwatchr download officialgeilegisela
```

The user must be live. Output is saved to the current directory.

### Wait for a user to go live

```bash
tokwatchr watch username
```

Polls every 3 minutes by default. Recording starts automatically when the user goes live.

---

## Commands

### `download <username>`

Download a TikTok livestream immediately. Fails if the user is not live.

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <dir>` | Output directory | current directory |
| `-q, --quality <quality>` | Quality preference: `best`, `worst`, `hd1`, `sd1` | `best` |
| `-f, --format <format>` | Output format: `mp4`, `mkv`, `ts`, `flv` | `mp4` |
| `--proxy <url>` | HTTP/SOCKS proxy URL | — |
| `--no-ffmpeg` | Skip ffmpeg processing | — |

```bash
# Basic usage
tokwatchr download officialgeilegisela

# Custom output directory and quality
tokwatchr download tv_asahi_news -o ./vods -q hd1

# Via proxy
tokwatchr download username --proxy socks5://localhost:1080

# Raw FLV output (no ffmpeg)
tokwatchr download username --no-ffmpeg
```

### `watch <username>`

Watch for a user to go live, then start recording. Polls periodically until the stream starts.

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <dir>` | Output directory | current directory |
| `-q, --quality <quality>` | Quality preference | `best` |
| `-f, --format <format>` | Output format | `mp4` |
| `-d, --max-duration <minutes>` | Max recording duration | no limit |
| `-s, --segment-duration <minutes>` | Segment length | 20 minutes |
| `-i, --interval <minutes>` | Poll interval | 3 minutes |
| `--proxy <url>` | HTTP/SOCKS proxy URL | — |
| `--no-ffmpeg` | Skip ffmpeg processing | — |

```bash
# Watch a single user
tokwatchr watch username

# 2-hour recording with 10-minute segments, check every minute
tokwatchr watch username -d 120 -s 10 -i 1
```

---

## Output

The tool streams to a `.ts` file during recording. When the stream ends or you press Ctrl+C, the segment is remuxed to `.mp4` with EBU R128 audio normalization.

```
Resolving room...
Recording My Stream...
  45.2 MB @ 3.1 MB/s  [1:23]
  Remuxed: ./username=20260606_185024_part1.mp4
  Saved: ./username=20260606_185024_part1.mp4  (45.2 MB, 1:23)
  Done — 1 segment(s), 45.2MB total
```

In watch mode, elapsed wait time is shown:

```
Waiting for username to go live...
  Waiting... 2m 15s

@username
  Recording...
```

---

## How it works

```
Username
  │
  ├─ GET @{user}/live              (HTML scrape for roomId)
  │    └─ fallback: /api-live/user/room/
  │
  ▼
Room ID
  │
  ├─ GET /webcast/room/info/       (fetch stream URLs + qualities)
  │
  ▼
FLV endpoint  ────►  1080p | 720p | 540p | 360p
  │
  ├─ With ffmpeg:
  │    ffmpeg -i <flv_url> -c copy segment.ts   → measure loudness
  │                                                 → remux with loudnorm
  │                                                 → segment.mp4
  │
  └─ Without ffmpeg:
       HTTP stream → file.flv
```

1. **Room ID resolution** — scrapes the user's TikTok live page for the embedded room ID, or falls back to the API endpoint.
2. **Stream URL fetch** — calls the webcast API to get available stream qualities and selects the best.
3. **Download to `.ts`** — saves the raw stream as MPEG-TS, which is playable even if truncated mid-stream.
4. **Remux with normalization** — two-pass EBU R128 loudnorm to -14 LUFS, AAC encode at 128k, video copied without re-encode.
5. **Segment loop** — if `--segment-duration` is set, the process repeats for each segment.

All HTTP requests use [impit](https://github.com/apify/impit) with Chrome TLS fingerprint emulation to bypass bot detection.

---

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [FFmpeg](https://ffmpeg.org) (for `.mp4` output)

### Commands

| Command | Action |
|---------|--------|
| `bun run src/index.ts <command>` | Run the CLI directly from source |
| `bun run build` | Build with tsdown → `dist/` |
| `bun run typecheck` | TypeScript type check |
| `bun run test` | Run test suite |
| `bun run lint` | Lint with Biome |
| `bun run format` | Format check with Biome |

### Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | [Bun](https://bun.sh) |
| Language | [TypeScript](https://www.typescriptlang.org) (strict) |
| CLI framework | [cac](https://github.com/cacjs/cac) |
| Download engine | [tokwatchr](https://github.com/zfadhli/tokwatchr) |
| Terminal colors | [picocolors](https://github.com/alexeyraspopov/picocolors) |
| Testing | [Bun test](https://bun.sh/docs/cli/test) |
| Lint + Format | [Biome](https://biomejs.dev) |
| Build | [tsdown](https://github.com/sxzz/tsdown) |
| CI | [GitHub Actions](./.github/workflows/ci.yml) |
