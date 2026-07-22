/**
 * Build-time Notion → static content generator.
 *
 * Runs in Node during `npm run build`. It pulls every story/character from
 * Notion once and writes plain JSON + pre-rendered HTML into public/content/.
 * The deployed site then makes ZERO Notion calls at runtime — it just serves
 * static files, so it loads at CDN speed. (This is the fix for "Notion is slow".)
 *
 * Resilience:
 *   - If NOTION_TOKEN is not set, the script exits without touching anything,
 *     so the committed seed content is used and the build still succeeds.
 *   - Content is fetched fully into memory FIRST and only written to disk once a
 *     locale succeeds — a failed fetch never wipes existing/seed content.
 *   - A failing locale/database is logged with a hint and skipped; the build is
 *     NOT broken. Set NOTION_STRICT=1 to make content errors fail the build.
 *
 * Expiring Notion image URLs are downloaded and rewritten to local paths, so
 * images never break and are served straight from your own host.
 *
 * Env vars:
 *   NOTION_TOKEN
 *   NOTION_TR_DATABASE_ID            NOTION_EN_DATABASE_ID
 *   NOTION_CHARACTER_TR_DATABASE_ID  NOTION_CHARACTER_EN_DATABASE_ID
 *   NOTION_STRICT=1                  (optional) fail the build on content errors
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
const STRICT = process.env.NOTION_STRICT === "1";

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
  if (!url) return null;
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
    if (!existsSync(IMG_DIR)) await mkdir(IMG_DIR, { recursive: true });
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

/**
 * Fetch + render an entire locale INTO MEMORY, then (only on success) write it
 * to disk, replacing that locale's folder. If anything throws before the write
 * phase, existing content on disk is left untouched.
 */
async function buildLocale(locale, cfg) {
  if (!cfg.stories) {
    console.log(`— ${locale}: no stories database id, skipping.`);
    return { skipped: true };
  }
  console.log(`\n▶ ${locale.toUpperCase()}`);

  /* ---- Stories (fetch + render into memory) ---- */
  const storyPages = (await queryAll(cfg.stories)).filter((p) => {
    const s = statusName(p.properties.Status);
    return !s || s === "Published";
  });

  const storySummaries = [];
  const storyPageBySlug = [];
  for (const page of storyPages) {
    try {
      const summary = await mapStory(page);
      storySummaries.push(summary);
      storyPageBySlug.push({ page, summary });
    } catch (err) {
      console.warn(`   ! story skipped: ${err.message}`);
    }
  }

  const storyDocs = [];
  for (const { page, summary } of storyPageBySlug) {
    if (!summary.slug) continue;
    let content = "";
    try {
      content = await renderPage(page.id);
    } catch (err) {
      console.warn(`   ! story body "${summary.slug}": ${err.message}`);
    }
    storyDocs.push({ ...summary, content });
  }

  /* ---- Characters (fetch + render into memory) ---- */
  let charSummaries = [];
  const charDocs = [];
  if (cfg.characters) {
    const characterPages = await queryAll(cfg.characters);
    const charPageBySlug = [];
    for (const page of characterPages) {
      try {
        const summary = await mapCharacter(page);
        charSummaries.push(summary);
        charPageBySlug.push({ page, summary });
      } catch (err) {
        console.warn(`   ! character skipped: ${err.message}`);
      }
    }
    for (const { page, summary } of charPageBySlug) {
      if (!summary.slug) continue;
      const related = storySummaries.filter(
        (s) =>
          s.characters.includes(summary.slug) ||
          s.characters.includes(summary.name),
      );
      let content = "";
      try {
        content = await renderPage(page.id);
      } catch (err) {
        console.warn(`   ! character body "${summary.slug}": ${err.message}`);
      }
      charDocs.push({ ...summary, content, stories: related });
    }
  }

  /* ---- everything fetched OK → write (destructive, but only now) ---- */
  await rm(path.join(OUT, locale), { recursive: true, force: true });
  await writeJSON(`${locale}/stories.json`, storySummaries);
  for (const doc of storyDocs) {
    await writeJSON(`${locale}/stories/${doc.slug}.json`, doc);
  }
  await writeJSON(`${locale}/characters.json`, charSummaries);
  for (const doc of charDocs) {
    await writeJSON(`${locale}/characters/${doc.slug}.json`, doc);
  }

  console.log(
    `  ✓ ${storySummaries.length} stories, ${charSummaries.length} characters`,
  );
  return { stories: storySummaries.length, characters: charSummaries.length };
}

/** Turn a Notion API error into a short, actionable hint. */
function explain(err) {
  const code = err?.code ?? err?.body?.code;
  const status = err?.status;
  const byCode = {
    unauthorized: "NOTION_TOKEN geçersiz veya eksik.",
    restricted_resource:
      "Entegrasyonun bu veritabanına erişimi yok — Notion'da veritabanını aç, ••• → Connections → integration'ı ekle.",
    object_not_found:
      "Veritabanı bulunamadı — DB ID yanlış olabilir ya da integration bu veritabanıyla paylaşılmamış.",
    validation_error: "İstek geçersiz — DB ID biçimini kontrol et.",
  };
  const byStatus = {
    401: "401 — NOTION_TOKEN geçersiz veya eksik.",
    403: "403 — Token geçerli ama bu veritabanına erişim yok; Notion'da veritabanını integration ile paylaş (••• → Connections).",
    404: "404 — DB ID bulunamadı; ID'yi ve paylaşımı kontrol et.",
  };
  if (code && byCode[code]) return `${code}: ${byCode[code]}`;
  if (status && byStatus[status]) return byStatus[status];
  return err?.message ?? String(err);
}

async function main() {
  if (!existsSync(IMG_DIR)) await mkdir(IMG_DIR, { recursive: true });
  console.log("Fetching content from Notion…");

  const failures = [];
  for (const [locale, cfg] of Object.entries(LOCALE_CONFIG)) {
    try {
      await buildLocale(locale, cfg);
    } catch (err) {
      failures.push(locale);
      console.error(`\n✗ ${locale.toUpperCase()} atlandı → ${explain(err)}`);
    }
  }

  if (failures.length) {
    console.warn(
      `\n⚠️  Çekilemeyen dil(ler): ${failures.join(", ")}. ` +
        `Mevcut/seed içerikle devam ediliyor.\n` +
        `   (Build'i bu durumda kırmak istersen NOTION_STRICT=1 kullan.)\n`,
    );
    if (STRICT) process.exit(1);
  } else {
    console.log("\n✓ Content generated in public/content/\n");
  }
}

main().catch((err) => {
  console.error("\n✗ Notion fetch failed:", explain(err));
  // Never break the build over a content error unless explicitly strict.
  process.exit(STRICT ? 1 : 0);
});
