import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import sql from '$lib/db';
import archiver from 'archiver';
import { readFile, existsSync } from 'fs';
import { promisify } from 'util';
import { join } from 'path';

const readFileAsync = promisify(readFile);
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'static/uploads';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-]/gi, '_').substring(0, 50);
}

async function fetchEntries(topicId: string, userId: string, tagId: string | null) {
  return await sql`
        SELECT
            e.id, e.title, e.body, e.mood,
            e.entry_date::text,
            CASE WHEN t.id IS NOT NULL THEN
                JSON_BUILD_OBJECT('id', t.id, 'name', t.name, 'color', t.color)
            ELSE NULL END AS tag,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT('id', m.id, 'url', m.url)
                ) FILTER (WHERE m.id IS NOT NULL),
                '[]'
            ) AS media
        FROM entries e
        LEFT JOIN entry_media m ON m.entry_id = e.id
        LEFT JOIN topic_tags t ON t.id = e.tag_id
        WHERE e.topic_id = ${topicId}
        AND e.user_id = ${userId}
        ${tagId ? sql`AND e.tag_id = ${tagId}` : sql``}
        GROUP BY e.id, t.id
        ORDER BY e.entry_date ASC, e.created_at ASC
    `;
}

function entryToMarkdown(entry: any): string {
  const lines: string[] = [];
  lines.push(`# ${entry.title ?? 'Untitled'}`);
  lines.push(`Date: ${entry.entry_date}`);
  if (entry.tag?.name) lines.push(`Tag: ${entry.tag.name}`);
  if (entry.mood) lines.push(`Mood: ${entry.mood}`);
  lines.push('');
  lines.push(entry.body ?? '');
  if (entry.media.length > 0) {
    lines.push('');
    for (const img of entry.media) {
      const filename = img.url.replace('/', '_') + '.jpg';
      lines.push(`![image](../images/${filename})`);
    }
  }
  return lines.join('\n');
}

async function imageToBase64(url: string): Promise<string | null> {
  const filepath = join(UPLOAD_DIR, url);
  if (!existsSync(filepath)) return null;
  const buffer = await readFileAsync(filepath);
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

const moods = ['😞', '😕', '😐', '🙂', '😄'];

async function generateHtml(topic: any, entries: any[], tagName: string | null): Promise<string> {
  const entryHtmlParts: string[] = [];

  for (const entry of entries) {
    // convert images to base64
    const imageHtmlParts: string[] = [];
    const imageCount = entry.media.length;

    for (const media of entry.media) {
      const b64 = await imageToBase64(media.url);
      if (b64) imageHtmlParts.push(`<img src="${b64}" alt=""/>`);
    }

    const gridClass = imageCount === 1 ? 'grid-1'
      : imageCount === 2 ? 'grid-2'
        : imageCount === 3 ? 'grid-3'
          : 'grid-4';

    entryHtmlParts.push(`
            <article class="entry">
                <header class="entry-header">
                    <div class="entry-meta">
                        <time>${formatDate(entry.entry_date)}</time>
                        ${entry.tag ? `<span class="tag" style="background:${entry.tag.color}">${entry.tag.name}</span>` : ''}
                        ${entry.mood ? `<span class="mood">${moods[entry.mood - 1]}</span>` : ''}
                    </div>
                    ${entry.title ? `<h2 class="entry-title">${entry.title}</h2>` : ''}
                </header>
                ${imageHtmlParts.length > 0 ? `
                    <div class="image-grid ${gridClass}">
                        ${imageHtmlParts.join('')}
                    </div>
                ` : ''}
                <div class="entry-body">${(entry.body ?? '').replace(/\n/g, '<br/>')}</div>
            </article>
        `);
  }

  const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${topic.name}${tagName ? ` — ${tagName}` : ''}</title>
    <style>
        <!-- Add inside the <style> block -->
        @media print {
            .cover { page-break-after: always; }
            .entry { page-break-inside: avoid; }
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #1a1a1a;
            background: #fff;
            max-width: 720px;
            margin: 0 auto;
            padding: 2rem 1.5rem;
        }

        /* Cover */
        .cover {
            text-align: center;
            padding: 4rem 0 3rem;
            border-bottom: 1px solid #e5e5e5;
            margin-bottom: 3rem;
        }
        .cover-icon { font-size: 4rem; margin-bottom: 1rem; }
        .cover-title { font-size: 2rem; font-weight: 600; letter-spacing: -0.5px; }
        .cover-sub { color: #666; margin-top: 0.5rem; font-size: 0.95rem; }
        .cover-meta { margin-top: 1.5rem; color: #999; font-size: 0.85rem; }

        /* Entry */
        .entry {
            margin-bottom: 3rem;
            padding-bottom: 3rem;
            border-bottom: 1px solid #e5e5e5;
        }
        .entry:last-child { border-bottom: none; }

        .entry-header { margin-bottom: 1rem; }

        .entry-meta {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.85rem;
            color: #888;
            margin-bottom: 0.4rem;
        }

        .entry-title {
            font-size: 1.3rem;
            font-weight: 600;
            letter-spacing: -0.3px;
        }

        .tag {
            display: inline-block;
            padding: 0.15rem 0.6rem;
            border-radius: 999px;
            font-size: 0.75rem;
            color: #fff;
            font-weight: 500;
        }

        .mood { font-size: 1rem; }

        /* Image grid */
        .image-grid {
            display: grid;
            gap: 6px;
            margin: 1rem 0;
            border-radius: 8px;
            overflow: hidden;
        }
        .grid-1 { grid-template-columns: 1fr; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr; }
        .grid-3 img:first-child { grid-row: span 2; }
        .grid-4 { grid-template-columns: 1fr 1fr; }

        .image-grid img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            max-height: 400px;
        }
        .grid-1 img { max-height: 500px; }

        /* Body */
        .entry-body {
            font-size: 0.95rem;
            line-height: 1.75;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="cover">
        <div class="cover-icon">${topic.icon ?? '📓'}</div>
        <h1 class="cover-title">${topic.name}</h1>
        ${tagName ? `<p class="cover-sub">${tagName}</p>` : ''}
        <p class="cover-meta">${entries.length} entries · Exported ${exportDate}</p>
    </div>

    ${entryHtmlParts.join('\n')}
</body>
</html>`;
}

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) error(401);

  const topicId = url.searchParams.get('topic');
  const tagId = url.searchParams.get('tag') || null;
  const format = url.searchParams.get('format') ?? 'zip';

  if (!topicId) error(400, 'Missing topic');

  const topics = await sql`
        SELECT id, name, icon FROM topics
        WHERE id = ${topicId} AND user_id = ${locals.user.id}
    `;
  if (topics.length === 0) error(404, 'Topic not found');
  const topic = topics[0];

  let tagName: string | null = null;
  if (tagId) {
    const tags = await sql`SELECT name FROM topic_tags WHERE id = ${tagId}`;
    tagName = tags[0]?.name ?? null;
  }

  const entries = await fetchEntries(topicId, locals.user.id, tagId);
  const exportDate = new Date().toISOString().split('T')[0];
  const topicSlug = sanitizeFilename(topic.name);
  const tagSlug = tagName ? `_${sanitizeFilename(tagName)}` : '';

  if (format === 'html') {
    const html = await generateHtml(topic, entries, tagName);
    const filename = `${topicSlug}${tagSlug}_${exportDate}.html`;
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  }

  // ZIP export
  const archive = archiver('zip', { zlib: { level: 6 } });
  const chunks: Buffer[] = [];
  archive.on('data', (chunk: Buffer) => chunks.push(chunk));
  const zipPromise = new Promise<void>((resolve, reject) => {
    archive.on('end', resolve);
    archive.on('error', reject);
  });

  for (const entry of entries) {
    const date = entry.entry_date;
    const title = sanitizeFilename(entry.title ?? 'untitled');
    archive.append(entryToMarkdown(entry), { name: `entries/${date}_${title}.md` });
  }

  const allMedia = entries.flatMap((e: any) => e.media);
  for (const media of allMedia) {
    const filepath = join(UPLOAD_DIR, media.url);
    if (existsSync(filepath)) {
      archive.file(filepath, { name: `images/${media.url.replace('/', '_')}.jpg` });
    }
  }

  archive.finalize();
  await zipPromise;

  const filename = `${topicSlug}${tagSlug}_${exportDate}.zip`;
  return new Response(Buffer.concat(chunks), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  });
};