// Reject unresolved LFS pointers and malformed/non-streamable delivery files.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let checked = 0;
let failures = 0;
function check(file) {
  const data = readFileSync(file);
  if (data.subarray(0, 128).toString().startsWith('version https://git-lfs.github.com/spec/v1')) {
    throw new Error('Git LFS pointer: run git lfs install --local && git lfs pull before building');
  }
  if (file.endsWith('.webm')) {
    if (data.length < 4 || data.readUInt32BE(0) !== 0x1a45dfa3) throw new Error('Missing WebM/EBML header');
    return;
  }
  const boxes = [];
  for (let offset = 0; offset < data.length;) {
    if (offset + 8 > data.length) throw new Error('Truncated MP4 box header');
    let size = data.readUInt32BE(offset);
    let header = 8;
    const type = data.toString('ascii', offset + 4, offset + 8);
    if (size === 1) {
      header = 16;
      if (offset + header > data.length) throw new Error('Truncated extended MP4 box header');
      size = Number(data.readBigUInt64BE(offset + 8));
    } else if (size === 0) size = data.length - offset;
    if (!Number.isSafeInteger(size) || size < header || offset + size > data.length) throw new Error('Invalid MP4 box size');
    boxes.push(type);
    offset += size;
  }
  if (boxes[0] !== 'ftyp' || !boxes.includes('moov') || !boxes.includes('mdat')) {
    throw new Error('Missing MP4 file type, metadata, or media');
  }
  if (boxes.indexOf('moov') > boxes.indexOf('mdat')) {
    throw new Error('MP4 needs fast-start metadata: remux with ffmpeg -c copy -movflags +faststart');
  }
}

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(mp4|webm)$/.test(entry.name)) {
      checked++;
      try { check(file); }
      catch (error) { console.error(`${file}: ${error.message}`); failures++; }
    }
  }
}
const directories = process.argv.slice(2);
if (!directories.length) throw new Error('Pass the media directories to check');
directories.forEach(walk);
if (!checked) throw new Error('No video files found');
console.log(`${checked} videos checked, ${failures} invalid file(s)`);
process.exitCode = failures ? 1 : 0;
