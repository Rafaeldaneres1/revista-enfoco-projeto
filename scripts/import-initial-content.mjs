import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = path.resolve(process.cwd());
const CONTENT_FILE = path.join(ROOT_DIR, 'frontend', 'src', 'data', 'initialContent.js');
const BACKEND_URL = (process.env.BACKEND_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.');
  process.exit(1);
}

const looksMisencoded = (value) => typeof value === 'string' && /Ã|Â|â€¢|â€“|â€”|â€/.test(value);

const fixEncoding = (value = '') => {
  if (!looksMisencoded(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0)));
    const decoded = new TextDecoder('utf-8').decode(bytes);

    if (decoded && !decoded.includes('�')) {
      return decoded;
    }
  } catch (error) {
    console.error('Error decoding text:', error);
  }

  return value
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ã ', 'à')
    .replaceAll('Ã¢', 'â')
    .replaceAll('Ã£', 'ã')
    .replaceAll('Ã©', 'é')
    .replaceAll('Ãª', 'ê')
    .replaceAll('Ã­', 'í')
    .replaceAll('Ã³', 'ó')
    .replaceAll('Ã´', 'ô')
    .replaceAll('Ãµ', 'õ')
    .replaceAll('Ãº', 'ú')
    .replaceAll('Ã§', 'ç')
    .replaceAll('â€¢', '•')
    .replaceAll('â€“', '–')
    .replaceAll('â€”', '—')
    .replaceAll('â€œ', '“')
    .replaceAll('â€\u009d', '”')
    .replaceAll('â€˜', '‘')
    .replaceAll('â€™', '’');
};

const normalizeContent = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeContent);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeContent(item)]));
  }

  if (typeof value === 'string') {
    return fixEncoding(value).trim();
  }

  return value;
};

const loadInitialContent = async () => {
  const source = await fs.readFile(CONTENT_FILE, 'utf8');
  const transformed = `${source.replaceAll('export const ', 'const ')}\nglobalThis.__initialContent = { fallbackPosts, fallbackColumns, fallbackEditions };`;
  const context = {
    console,
    TextDecoder,
    Uint8Array,
    globalThis: {}
  };

  vm.createContext(context);
  vm.runInContext(transformed, context, { timeout: 1000, filename: 'initialContent.js' });

  return context.globalThis.__initialContent;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  return response.json();
};

const login = async () => {
  const data = await request(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  return data.access_token;
};

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

const upsertCollection = async ({ token, collectionPath, items, getKey, buildPayload }) => {
  const existingItems = await request(`${BACKEND_URL}${collectionPath}`, {
    headers: authHeaders(token)
  });
  const existingMap = new Map(existingItems.map((item) => [getKey(item), item]));

  let created = 0;
  let updated = 0;

  for (const item of items) {
    const normalized = normalizeContent(item);
    const existing = existingMap.get(getKey(normalized));
    const payload = buildPayload(normalized);

    if (existing) {
      await request(`${BACKEND_URL}${collectionPath}/${existing.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
      });
      updated += 1;
    } else {
      await request(`${BACKEND_URL}${collectionPath}`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
      });
      created += 1;
    }
  }

  return { created, updated };
};

const main = async () => {
  const { fallbackPosts, fallbackColumns, fallbackEditions } = await loadInitialContent();
  const token = await login();

  const posts = await upsertCollection({
    token,
    collectionPath: '/api/posts',
    items: fallbackPosts,
    getKey: (item) => item.slug,
    buildPayload: (post) => ({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category || 'Geral',
      featured_image: post.featured_image || '',
      image_position: post.image_position || '',
      author_name: post.author_name || '',
      published: Boolean(post.published)
    })
  });

  const columns = await upsertCollection({
    token,
    collectionPath: '/api/columns',
    items: fallbackColumns,
    getKey: (item) => item.slug,
    buildPayload: (column) => ({
      title: column.title,
      content: column.content,
      excerpt: column.excerpt,
      featured_image: column.featured_image || '',
      image_position: column.image_position || '',
      author_name: column.author_name || '',
      author_role: column.author_role || '',
      author_bio: column.author_bio || '',
      author_image: column.author_image || '',
      published: Boolean(column.published)
    })
  });

  const editions = await upsertCollection({
    token,
    collectionPath: '/api/editions',
    items: fallbackEditions,
    getKey: (item) => item.slug,
    buildPayload: (edition) => ({
      title: edition.title,
      description: edition.description,
      cover_image: edition.cover_image || '',
      edition_number: Number(edition.edition_number),
      pdf_url: edition.pdf_url || '',
      page_count: edition.page_count ? Number(edition.page_count) : null,
      pages_base_path: edition.pages_base_path || '',
      preview_pages: edition.preview_pages || [],
      published: Boolean(edition.published)
    })
  });

  const siteContentSource = await fs.readFile(
    path.join(ROOT_DIR, 'frontend', 'src', 'data', 'siteContent.js'),
    'utf8'
  );
  const transformedSiteContent = `${siteContentSource.replaceAll('export const ', 'const ')}\nglobalThis.__siteContent = siteContent;`;
  const siteContentContext = { console, TextDecoder, Uint8Array, globalThis: {} };
  vm.createContext(siteContentContext);
  vm.runInContext(transformedSiteContent, siteContentContext, { timeout: 1000, filename: 'siteContent.js' });
  const siteContent = normalizeContent(siteContentContext.globalThis.__siteContent);

  const team = await upsertCollection({
    token,
    collectionPath: '/api/team',
    items: siteContent.team || [],
    getKey: (item) => item.name,
    buildPayload: (member) => ({
      name: member.name,
      role: member.role,
      image: member.image || '',
      bio: member.bio || '',
      display_order: Number(member.display_order || 0),
      published: member.published !== false
    })
  });

  await request(`${BACKEND_URL}/api/about`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({
      location: siteContent.location || 'Santa Maria - RS',
      cover_image: siteContent.about.coverImage || '',
      eyebrow: siteContent.about.eyebrow || '',
      hero_title: siteContent.about.heroTitle || '',
      intro: siteContent.about.intro || '',
      paragraphs: siteContent.about.paragraphs || [],
      mission: siteContent.about.mission || '',
      values: siteContent.about.values || [],
      team_title: siteContent.about.teamTitle || 'Equipe Editorial',
      team_description:
        siteContent.about.teamDescription ||
        'Rostos e vozes que ajudam a construir a presença editorial da EnFoco com sensibilidade e identidade.',
      contact_title: siteContent.about.contactTitle || 'Entre em Contato',
      contact_description:
        siteContent.about.contactDescription ||
        'Os canais oficiais serão publicados assim que o material institucional definitivo for enviado.',
      contact_email: siteContent.contact.email || '',
      contact_phone: siteContent.contact.phone || '',
      contact_city: siteContent.contact.city || siteContent.location || 'Santa Maria - RS',
      social: siteContent.contact.social || {}
    })
  });

  console.log(
    JSON.stringify(
      {
        posts,
        columns,
        editions,
        team,
        about: {
          updated: 1
        }
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
