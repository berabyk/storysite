/**
 * Build-time Notion → static content generator.
 *
 * Runs in Node during `npm run build`. It pulls every story/character from
 * Notion once and writes plain JSON + pre-rendered HTML into public/content/.
 * The deployed site then makes ZERO Notion calls at runtime — it just serves
 * static files, so it loads at CDN speed. (This is the fix for "Notion is slow".)
 *
 * If NOTION_TOKEN is not set, the script exits without touching anything, so
 * the committed seed content is used instead and the build still succeeds.
 *
 * Expiring Notion image URLs are downloaded and rewritten to local paths, so
 * images never break and are served straight from your own host.
 *
 * Env vars:
 *   NOTION_TOKEN
 *   NOTION_TR_DATABASE_ID            NOTION_EN_DATABASE_ID
 *   NOTION_CHARACTER_TR_DATABASE_ID  NOTION_CHARACTER_EN_DATABASE_ID
 */
import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";

import { Client } from "@notionhq/client";
import { NotionRenderer } from "@notion-render/client";
import hljsPlugin from "@notion-render/hljs-plugin";
import bookmarkPlugin from "@notion-render/bookmark-plugin";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "content");
const IMG_DIR = path.join(OUT, "images");
const FALLBACK_IMG = null;

const TOKEN = process.env.NOTION_TOKEN;

const LOCALE_CONFIG = {
  tr: {
    stories: process.env.NOTION_TR_DATABASE_ID,
    characters: process.env.NOTION_CHARACTER_TR_DATABASE_ID,
  },
  en: {
    stories: process.env.NOTION_EN_DATABASE_ID,
    characters: process.env.NOTION_CHARACTER_EN_DATABASE_ID,
  },
};

if (!TOKEN) {
  console.warn(
    "\n⚠️  NOTION_TOKEN not set — skipping Notion fetch.\n" +
      "   Using the committed seed content in public/content/.\n" +
      "   Set NOTION_TOKEN and the *_DATABASE_ID vars (see .env.example) to\n" +
      "   generate real content.\n",
  );
  process.exit(0);
}

const notion = new Client({ auth: TOKEN });

/* ----------------------------- property helpers ---------------------------- */

const richText = (prop) =>
  (prop?.title ?? prop?.rich_text ?? [])
    .map((t) => t.plain_text)
    .join("")
    .trim();

const selectName = (prop) => prop?.select?.name ?? prop?.status?.name ?? "";

const multiValues = (prop) =>
  (prop?.multi_select ?? []).map((o) => o.name).filter(Boolean);

const rawFileUrl = (prop) => {
  const f = prop?.files?.[0];
  if (!f) return null;
  return f.type === "external" ? f.external?.url : f.file?.url;
};

const statusName = (prop) =>
  prop?.select?.name ?? prop?.status?.name ?? prop?.rich_text?.[0]?.plain_text;

/* ------------------------------ image handling ----------------------------- */

const imageCache = new Map();
const EXPIRING = /amazonaws\.com|secure\.notion-static\.com|notion\.so\/image/;

async function localizeImage(url) {
  if (!url) return FALLBACK_IMG;
  if (!EXPIRING.test(url)) return url; // stable external URL — leave as-is
  const key = url.split("?")[0];
  if (imageCache.has(key)) return imageCache.get(key);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "";
    const ext = ct.includes("png")
      ? "png"
      : ct.includes("webp")
        ? "webp"
        : ct.includes("gif")
          ? "gif"
          : ct.includes("svg")
            ? "svg"
            : "jpg";
    const name =
      crypto.createHash("sha1").update(key).digest("hex").slice(0, 16) +
      "." +
      ext;
    await writeFile(path.join(IMG_DIR, name), buf);
    const local = `/content/images/${name}`;
    imageCache.set(key, local);
    return local;
  } catch (err) {
    console.warn(`   ! image download failed (${url.slice(0, 60)}…): ${err.message}`);
    return url;
  }
}

async function localizeHtml(html) {
  const urls = new Set();
  const re = /<img[^>]+src="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) urls.add(m[1]);
  for (const u of urls) {
    const local = await localizeImage(u);
    if (local && local !== u) html = html.split(u).join(local);
  }
  return html;
}

/* --------------------------------- Notion ---------------------------------- */

async function queryAll(databaseId) {
  const pages = [];
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages.filter((p) => p.properties);
}

async function renderPage(pageId) {
  const blocks = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  const renderer = new NotionRenderer({ client: notion });
  renderer.use(hljsPlugin({}));
  renderer.use(bookmarkPlugin(undefined));
  const html = await renderer.render(...blocks);
  return localizeHtml(html);
}

/* --------------------------------- mapping --------------------------------- */

async function mapStory(page) {
  const p = page.properties;
  return {
    id: page.id,
    slug: richText(p.Slug),
    title: richText(p.Title),
    explanation: richText(p.Explanation),
    image: await localizeImage(rawFileUrl(p.BannerImage)),
    createdTime: page.created_time,
    characters: multiValues(p.Characters),
  };
}

async function mapCharacter(page) {
  const p = page.properties;
  return {
    id: page.id,
    slug: richText(p.Slug),
    name: richText(p.Name),
    explanation: richText(p.Explanation),
    image: await localizeImage(rawFileUrl(p.Image)),
    kind: selectName(p.Kind),
  };
}

/* --------------------------------- writing --------------------------------- */

async function writeJSON(rel, data) {
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data));
}

/* ----------------------------------- run ----------------------------------- */

async function buildLocale(locale, cfg) {
  if (!cfg.stories) {
    console.log(`— ${locale}: no stories database id, skipping.`);
    return;
  }
  console.log(`\n▶ ${locale.toUpperCase()}`);

  // Clean this locale's output (keep the shared images dir).
  await rm(path.join(OUT, locale), { recursive: true, force: true });

  /* Stories */
  const storyPages = (await queryAll(cfg.stories)).filter((p) => {
    const s = statusName(p.properties.Status);
    return !s || s === "Published";
  });

  const stories = [];
  for (const page of storyPages) {
    try {
      stories.push(await mapStory(page));
    } catch (err) {
      console.warn(`   ! story skipped: ${err.message}`);
    }
  }
  await writeJSON(`${locale}/stories.json`, stories);
  console.log(`  stories: ${stories.length}`);

  for (let i = 0; i < stories.length; i++) {
    const summary = stories[i];
    if (!summary.slug) continue;
    try {
      const content = await renderPage(storyPages[i].id);
      await writeJSON(`${locale}/stories/${summary.slug}.json`, {
        ...summary,
        content,
      });
    } catch (err) {
      console.warn(`   ! story body "${summary.slug}": ${err.message}`);
    }
  }

  /* Characters */
  if (!cfg.characters) {
    await writeJSON(`${locale}/characters.json`, []);
    return;
  }

  const characterPages = await queryAll(cfg.characters);
  const characters = [];
  for (const page of characterPages) {
    try {
      characters.push(await mapCharacter(page));
    } catch (err) {
      console.warn(`   ! character skipped: ${err.message}`);
    }
  }
  await writeJSON(`${locale}/characters.json`, characters);
  console.log(`  characters: ${characters.length}`);

  for (let i = 0; i < characters.length; i++) {
    const summary = characters[i];
    if (!summary.slug) continue;
    const related = stories.filter(
      (s) =>
        s.characters.includes(summary.slug) ||
        s.characters.includes(summary.name),
    );
    try {
      const content = await renderPage(characterPages[i].id);
      await writeJSON(`${locale}/characters/${summary.slug}.json`, {
        ...summary,
        content,
        stories: related,
      });
    } catch (err) {
      console.warn(`   ! character body "${summary.slug}": ${err.message}`);
    }
  }
}

async function main() {
  if (!existsSync(IMG_DIR)) await mkdir(IMG_DIR, { recursive: true });
  console.log("Fetching content from Notion…");
  for (const [locale, cfg] of Object.entries(LOCALE_CONFIG)) {
    await buildLocale(locale, cfg);
  }
  console.log("\n✓ Content generated in public/content/\n");
}

main().catch((err) => {
  console.error("\n✗ Notion fetch failed:", err);
  process.exit(1);
});
