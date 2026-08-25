// Turns the raw Higgsfield clips into web assets:
//  - hero orbit  -> a JPEG frame sequence for canvas scrubbing
//  - clips 2/3/4 -> faststart mp4s for background playback
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import ffmpeg from 'ffmpeg-static';

const FRAME_COUNT = 144;   // frames across the full 360 orbit
const FRAME_WIDTH = 1440;  // plenty for a full-bleed hero canvas
const JPEG_Q      = 5;     // mjpeg qscale, 1=best 31=worst

const run = (args) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });

function probeDuration(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' }); }
  catch (e) { out = `${e.stderr || ''}${e.stdout || ''}`; }
  const m = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  if (!m) throw new Error(`could not probe duration of ${file}`);
  return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
}

function extractFrames(src, outDir) {
  const dur = probeDuration(src);
  const fps = FRAME_COUNT / dur;
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  // sample evenly across [0, duration) so frame 0 and the wrap point stay distinct
  run(['-i', src, '-vf', `fps=${fps.toFixed(6)},scale=${FRAME_WIDTH}:-2:flags=lanczos`,
       '-frames:v', String(FRAME_COUNT), '-q:v', String(JPEG_Q), `${outDir}/%04d.jpg`]);
  const files = readdirSync(outDir).filter(f => f.endsWith('.jpg'));
  const bytes = files.reduce((n, f) => n + statSync(`${outDir}/${f}`).size, 0);
  console.log(`  frames: ${files.length}  duration: ${dur.toFixed(2)}s  fps: ${fps.toFixed(2)}  total: ${(bytes / 1e6).toFixed(1)} MB  avg: ${Math.round(bytes / files.length / 1024)} KB`);
  return files.length;
}

function optimiseVideo(src, out) {
  run(['-y', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '25',
       '-pix_fmt', 'yuv420p', '-vf', 'scale=1280:-2', '-an', '-movflags', '+faststart', out]);
  console.log(`  ${out.split('/').pop()}  ${(statSync(out).size / 1e6).toFixed(1)} MB`);
}

const hero = resolve('assets/01-hero-orbit.mp4');
if (existsSync(hero)) {
  console.log('› hero orbit → frame sequence');
  extractFrames(hero, resolve('public/frames/hero'));
}

for (const [file, name] of [['02-builder', 'builder'], ['03-creator', 'creator'], ['04-closer', 'closer']]) {
  const src = resolve(`assets/${file}.mp4`);
  if (!existsSync(src)) continue;
  console.log(`› ${name} → background video`);
  optimiseVideo(src, resolve(`public/video/${name}.mp4`));
}
console.log('done.');
