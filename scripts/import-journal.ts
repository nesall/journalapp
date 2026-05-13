import { readdir, readFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync, readFileSync } from 'fs';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import { randomBytes } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
import heicConvert from 'heic-convert';
// import { promisify } from 'util';
import fs from 'fs';

const virtualConsole = new VirtualConsole(); // silent — no output

dotenv.config();

// --- Config ---
const EXPORT_DIR = process.argv[2];
const TOPIC_ID = process.argv[3];
const USER_ID = process.argv[4];

if (!EXPORT_DIR || !TOPIC_ID || !USER_ID) {
  console.error('Usage: npx tsx scripts/import-journal.ts <export-dir> <topic-id> <user-id>');
  process.exit(1);
}

const ENTRIES_DIR = join(EXPORT_DIR, 'Entries');
const RESOURCES_DIR = join(EXPORT_DIR, 'Resources');
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'static/uploads';
const BASE_URL = process.env.BASE_URL ?? '';

const sql = postgres(process.env.DATABASE_URL!);

// --- Helpers ---

function slugToTitle(filename: string): string {
  // "2024-02-07_Work_in_progress.html" → "Work in progress"
  const base = basename(filename, '.html');
  const parts = base.split('_');
  // skip date part (YYYY-MM-DD)
  const titleParts = parts[0].match(/^\d{4}-\d{2}-\d{2}$/) ? parts.slice(1) : parts;
  return titleParts.join(' ');
}

function extractDate(filename: string): string {
  const match = basename(filename).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : new Date().toISOString().split('T')[0];
}

function extractText(html: string): string {
  const dom = new JSDOM(html, { virtualConsole });
  const doc = dom.window.document;

  // get bodyText div content
  const bodyText = doc.querySelector('.bodyText');
  if (bodyText) {
    return bodyText.textContent?.trim() ?? '';
  }

  // fallback: strip all tags
  return doc.body.textContent?.trim() ?? '';
}

function extractTitle(html: string, filename: string): string {
  const dom = new JSDOM(html, { virtualConsole });
  const titleEl = dom.window.document.querySelector('.title');
  const titleText = titleEl?.textContent?.trim();
  return titleText || slugToTitle(filename);
}

function extractImageGuids(html: string): string[] {
  const dom = new JSDOM(html, { virtualConsole });
  const imgs = dom.window.document.querySelectorAll('img.asset_image');
  return Array.from(imgs).map(img => {
    const src = img.getAttribute('src') ?? '';
    const base = basename(src);
    return base.replace(/\.(jpeg|heic|jpg)$/i, '');
  });
}

async function saveFile(buffer: Buffer, ext: string): Promise<string> {
  const key = randomBytes(16).toString('hex');
  const shard = key.substring(0, 2);
  const filename = key.substring(2);
  const dir = join(UPLOAD_DIR, shard);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename + ext), buffer);
  return `${shard}/${filename}${ext}`;
}

async function processImage(guid: string): Promise<{ key: string; thumbnailKey: string } | null> {
  const jpegPath = join(RESOURCES_DIR, `${guid}.jpeg`);
  const jpgPath = join(RESOURCES_DIR, `${guid}.jpg`);
  const heicPath = join(RESOURCES_DIR, `${guid}.HEIC`);
  const heicPathLower = join(RESOURCES_DIR, `${guid}.heic`);

  let inputBuffer: any | null = null;
  let isHeic = false;

  if (existsSync(jpegPath)) {
    const raw = await readFile(jpegPath);
    inputBuffer = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
  } else if (existsSync(jpgPath)) {
    const raw = await readFile(jpgPath);
    inputBuffer = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
  } else if (existsSync(heicPath)) {
    const raw = await readFile(heicPath);
    inputBuffer = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
    isHeic = true;
  } else if (existsSync(heicPathLower)) {
    const raw = await readFile(heicPathLower);
    inputBuffer = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
    isHeic = true;
  }

  if (!inputBuffer) {
    console.warn(`  ⚠ Image not found for GUID: ${guid}`);
    return null;
  }

  // convert HEIC to JPEG first if needed
  let jpegBuffer: Buffer;
  if (isHeic) {
    const converted = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.85
    });
    jpegBuffer = Buffer.from(converted);
  } else {
    jpegBuffer = inputBuffer;
  }

  // process with sharp
  const jpeg = await sharp(jpegBuffer)
    .rotate()
    .jpeg({ quality: 85 })
    .toBuffer();

  const thumbnail = await sharp(jpegBuffer)
    .rotate()
    .resize(300, 300, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 80 })
    .toBuffer();

  const key = await saveFile(jpeg, '.jpg');
  const thumbnailKey = await saveFile(thumbnail, '.jpg');

  return { key, thumbnailKey };
}

function getUrl(key: string): string {
  return `${BASE_URL}/uploads/${key}`;
}

// --- Main ---

async function main() {
  console.log(`\n📓 Journal Import`);
  console.log(`Export dir: ${EXPORT_DIR}`);
  console.log(`Topic ID:   ${TOPIC_ID}`);
  console.log(`User ID:    ${USER_ID}\n`);

  // verify topic exists and belongs to user
  const topics = await sql`
        SELECT id, name FROM topics
        WHERE id = ${TOPIC_ID}
        AND user_id = ${USER_ID}
    `;
  if (topics.length === 0) {
    console.error('Topic not found or does not belong to user');
    process.exit(1);
  }
  console.log(`✓ Topic: ${topics[0].name}\n`);

  const files = (await readdir(ENTRIES_DIR))
    .filter(f => extname(f) === '.html')
    .sort(); // chronological by filename

  console.log(`Found ${files.length} entries\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const entryDate = extractDate(file);
    const html = await readFile(join(ENTRIES_DIR, file), 'utf-8');
    const title = extractTitle(html, file);
    const body = extractText(html);
    const guids = extractImageGuids(html);

    console.log(`Processing: ${file}`);
    console.log(`  Date: ${entryDate} | Title: ${title} | Images: ${guids.length}`);

    // duplicate check
    const existing = await sql`
            SELECT id FROM entries
            WHERE topic_id = ${TOPIC_ID}
            AND user_id = ${USER_ID}
            AND entry_date = ${entryDate}
            AND title = ${title}
        `;

    if (existing.length > 0) {
      console.warn(`  ⚠ SKIPPED (duplicate): ${title} on ${entryDate}`);
      skipped++;
      continue;
    }

    try {
      // insert entry
      const rows = await sql`
                INSERT INTO entries (topic_id, user_id, title, body, entry_date)
                VALUES (${TOPIC_ID}, ${USER_ID}, ${title}, ${body}, ${entryDate})
                RETURNING id
            `;
      const entryId = rows[0].id;

      // process images
      for (const guid of guids) {
        const result = await processImage(guid);
        if (!result) continue;

        // read json metadata if exists
        let metadata = {};
        const jsonPath = join(RESOURCES_DIR, `${guid}.json`);
        if (existsSync(jsonPath)) {
          try {
            const raw = await readFile(jsonPath, 'utf-8');
            const parsed = JSON.parse(raw);
            // convert Apple epoch (seconds since 2001-01-01) to JS date
            const appleEpochOffset = 978307200;
            metadata = {
              ...parsed,
              date: parsed.date
                ? new Date((parsed.date + appleEpochOffset) * 1000).toISOString()
                : null
            };
          } catch {
            console.warn(`  ⚠ Could not parse JSON for ${guid}`);
          }
        }

        await sql`
                    INSERT INTO entry_media (entry_id, type, url, thumbnail_url, metadata)
                    VALUES (
                        ${entryId},
                        'image',
                        ${result.key},
                        ${result.thumbnailKey},
                        ${JSON.stringify(metadata)}
                    )
                `;
        console.log(`  ✓ Image: ${guid}`);
      }

      console.log(`  ✓ Imported: ${title}`);
      imported++;
    } catch (err) {
      console.error(`  ✗ Error importing ${file}:`, err);
      errors++;
    }
  }

  console.log(`\n─────────────────────────`);
  console.log(`✓ Imported: ${imported}`);
  console.log(`⚠ Skipped:  ${skipped}`);
  console.log(`✗ Errors:   ${errors}`);
  console.log(`─────────────────────────\n`);

  await sql.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});