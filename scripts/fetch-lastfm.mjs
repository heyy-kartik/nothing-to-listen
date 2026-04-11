import fs from "fs/promises";

const API_KEY = process.env.LASTFM_API_KEY;
const BASE = "https://ws.audioscrobbler.com/2.0";
const GHOST_IMAGE = "2a96cbd8b46e442fc41c2b86b821562f"; // Last.fm placeholder hash
const TARGET = 8000;
const DELAY = 250; // ms between requests — safe rate for Last.fm

if (!API_KEY) {
  console.error("❌  Set LASTFM_API_KEY env variable before running");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, params = {}) {
  const url = new URL(BASE);
  url.search = new URLSearchParams({
    method,
    api_key: API_KEY,
    format: "json",
    autocorrect: "1",
    ...params,
  });
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "nothing-to-listen/1.0 (portfolio project)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${method}`);
  return res.json();
}

// ── Phase 1: collect track stubs ──────────────────────────────────────────────
async function collectStubs() {
  const seen = new Map(); // "artist||title" → stub

  // Global chart — most popular tracks worldwide
  console.log("📡 Fetching global chart...");
  for (let page = 1; page <= 10; page++) {
    const data = await api("chart.getTopTracks", { limit: 1000, page });
    const tracks = data?.tracks?.track ?? [];
    if (!tracks.length) break;
    for (const t of tracks) {
      const key = `${t.artist.name}||${t.name}`;
      if (!seen.has(key))
        seen.set(key, { title: t.name, artist: t.artist.name });
    }
    console.log(`  chart p${page}: ${seen.size} unique so far`);
    await sleep(DELAY);
  }

  // Genre tags — diversifies the dataset beyond just pop/mainstream
  const tags = [
    "rock",
    "hiphop",
    "electronic",
    "jazz",
    "pop",
    "classical",
    "metal",
    "rnb",
    "indie",
    "alternative",
    "country",
    "reggae",
    "soul",
    "punk",
    "folk",
  ];
  for (const tag of tags) {
    if (seen.size >= TARGET * 1.5) break; // collect extra to account for drops
    for (let page = 1; page <= 4; page++) {
      const data = await api("tag.getTopTracks", { tag, limit: 1000, page });
      const tracks = data?.tracks?.track ?? [];
      if (!tracks.length) break;
      for (const t of tracks) {
        const key = `${t.artist.name}||${t.name}`;
        if (!seen.has(key))
          seen.set(key, { title: t.name, artist: t.artist.name, genre: tag });
      }
      await sleep(DELAY);
    }
    console.log(`  after tag "${tag}": ${seen.size} unique`);
  }

  return [...seen.values()];
}

// ── Phase 2: enrich stubs with album art + metadata ───────────────────────────
async function enrich(stub, index) {
  try {
    const data = await api("track.getInfo", {
      track: stub.title,
      artist: stub.artist,
    });
    const info = data?.track;
    if (!info) return null;

    // Pick largest available album art
    const images = info.album?.image ?? [];
    const imageUrl =
      images.find((i) => i.size === "extralarge")?.["#text"] ||
      images.find((i) => i.size === "large")?.["#text"] ||
      "";

    // Drop tracks with no art or the ghost placeholder
    if (!imageUrl || imageUrl.includes(GHOST_IMAGE)) return null;

    const genre = stub.genre ?? info.toptags?.tag?.[0]?.name ?? "";

    return {
      id: String(index).padStart(6, "0"),
      title: info.name,
      artist: stub.artist,
      album: info.album?.title ?? "",
      genre,
      listeners: parseInt(info.listeners ?? "0", 10),
      playcount: parseInt(info.playcount ?? "0", 10),
      mbid: info.mbid ?? "",
      url: info.url ?? "",
      // imageUrl kept temporarily — stripped after download
      imageUrl,
    };
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const stubs = await collectStubs();
console.log(`\n✅ Collected ${stubs.length} unique stubs`);
console.log(`🔍 Enriching (target: ${TARGET} valid songs)...\n`);

const songs = [];
for (let i = 0; i < stubs.length; i++) {
  if (songs.length >= TARGET) break;

  const song = await enrich(stubs[i], songs.length);
  if (song) songs.push(song);
  await sleep(DELAY);

  if (i % 200 === 0)
    console.log(`  ${i}/${stubs.length} processed → ${songs.length} valid`);
}

await fs.mkdir("public/json", { recursive: true });
await fs.writeFile("public/json/songs.json", JSON.stringify(songs, null, 2));
console.log(
  `\n✅ Done — wrote ${songs.length} songs to public/json/songs.json`,
);
