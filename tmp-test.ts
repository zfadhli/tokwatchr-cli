import { TikTokLiveDownloader } from "tokwatchr";

console.error("DEBUG: creating downloader");
const d = new TikTokLiveDownloader("yamichi_i", {
  output: ".",
  quality: "best",
  format: "mp4",
  useFfmpeg: true,
});
console.error("DEBUG: downloader created");

let called = false;
d.on("start", (info) => {
  called = true;
  console.error("DEBUG: start event:", info.title);
});
d.on("progress", () => {});
d.on("complete", (results) => {
  console.error("DEBUG: complete event,", results.length, "results");
});

console.error("DEBUG: calling startRecording");
const signal = "SIGINT";
process.on(signal as any, async () => {
  console.error("DEBUG: signal handler called");
  console.error("DEBUG: calling stop()");
  await d.stop();
  console.error("DEBUG: stop() returned");
  process.exit(130);
});

try {
  await d.startRecording();
  console.error("DEBUG: startRecording resolved");
} catch (e: any) {
  console.error("DEBUG: startRecording threw:", e?.constructor?.name, e?.message);
}
