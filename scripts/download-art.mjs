import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const songs = JSON.parse(await fs.readFile("public/json/songs.json", "utf-8"));

// Matches VITE_MEDIA_VERSION_0/1/2 in .env.local
const SIZES = [
  { dir: "v0", px: 64 }, // zoomed out — tiny thumbnails
  { dir: "v1", px: 128 }, // mid zoom
  { dir: "v2", px: 300 }, // selected / close up
];

for (const { dir } of SIZES)
  await fs.mkdir(`public/media/${dir}`, { recursive: true });

let ok = 0,
  fail = 0;

for (const song of songs) {
  const destV0 = `public/media/v0/${song.id}.jpg`;

  // Skip if already downloaded (safe to re-run)
  try {
    await fs.access(destV0);
    ok++;
    continue;
  } catch {}

  try {
    const res = await fetch(song.imageUrl, {
      headers: { "User-Agent": "nothing-to-listen/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    for (const { dir, px } of SIZES) {
      await sharp(buf)
        .resize(px, px, { fit: "cover", position: "centre" })
        .jpeg({ quality: 85 })
        .toFile(`public/media/${dir}/${song.id}.jpg`);
    }

    ok++;
    if (ok % 100 === 0) console.log(`✓ ${ok}/${songs.length}`);
  } catch (err) {
    fail++;
    console.warn(
      `✗ ${song.id} (${song.artist} - ${song.title}): ${err.message}`,
    );
  }
}

console.log(`\n✅ Done — ${ok} downloaded, ${fail} failed`);
