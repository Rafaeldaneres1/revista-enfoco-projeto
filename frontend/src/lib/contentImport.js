import { siteContent } from '../data/siteContent';
import axios from 'axios';
import { fallbackColumns, fallbackEditions, fallbackPosts } from '../data/initialContent';
import { apiUrl } from './api';

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

const upsertCollection = async ({ path, items, getKey, buildPayload }) => {
  const response = await axios.get(apiUrl(path));

  const existingItems = response.data || [];
  const existingMap = new Map(existingItems.map((item) => [getKey(item), item]));

  let created = 0;
  let updated = 0;

  for (const item of items) {
    const normalizedItem = normalizeContent(item);
    const payload = buildPayload(normalizedItem);
    const key = getKey(normalizedItem);
    const existing = existingMap.get(key);

    if (existing) {
      await axios.put(apiUrl(`${path}/${existing.id}`), payload, {
      });
      updated += 1;
    } else {
      await axios.post(apiUrl(path), payload);
      created += 1;
    }
  }

  return { created, updated };
};

export const importInitialContent = async () => {
  const posts = await upsertCollection({
    path: '/api/posts',
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
    path: '/api/columns',
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
    path: '/api/editions',
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

  const team = await upsertCollection({
    path: '/api/team',
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

  await axios.put(
    apiUrl('/api/home-settings'),
    {
      hero_primary_cta_label: siteContent.home.heroPrimaryCtaLabel || 'Ler Matéria',
      hero_secondary_cta_label: siteContent.home.heroSecondaryCtaLabel || 'Mais notícias',
      hero_secondary_label: siteContent.home.heroSecondaryLabel || 'Também em Destaque',
      featured_edition_label: siteContent.home.featuredEditionLabel || 'Em Destaque',
      featured_edition_title: siteContent.home.featuredEditionTitle || 'Edição Atual',
      featured_edition_primary_cta_label:
        siteContent.home.featuredEditionPrimaryCtaLabel || 'Abrir Revista',
      featured_edition_secondary_cta_label:
        siteContent.home.featuredEditionSecondaryCtaLabel || 'Ver Edição',
      recommended_label: siteContent.home.recommendedLabel || 'Leitura Recomendada',
      recommended_title_prefix: siteContent.home.recommendedTitlePrefix || 'Artigos em',
      recommended_title_emphasis: siteContent.home.recommendedTitleEmphasis || 'Destaque',
      recommended_link_label: siteContent.home.recommendedLinkLabel || 'Ver Todos',
      recommended_empty_message:
        siteContent.home.recommendedEmptyMessage ||
        'As chamadas editoriais da home serão exibidas aqui assim que as primeiras notícias forem cadastradas no backend.',
      archive_label: siteContent.home.archiveLabel || 'Acervo da Revista',
      archive_title: siteContent.home.archiveTitle || 'Edições para navegar',
      archive_description:
        siteContent.home.archiveDescription ||
        'Clique na capa para abrir o PDF e use as setas para navegar pelo acervo ou pelas páginas de prévia.',
      archive_primary_cta_label: siteContent.home.archivePrimaryCtaLabel || 'Abrir PDF Completo',
      archive_secondary_cta_label: siteContent.home.archiveSecondaryCtaLabel || 'Ver Edição',
      archive_empty_message:
        siteContent.home.archiveEmptyMessage ||
        'As edições da revista serão exibidas aqui assim que forem cadastradas no backend.'
    }
  );

  await axios.put(
    apiUrl('/api/about'),
    {
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
    }
  );

  return { posts, columns, editions, team, about: { updated: 1 }, home: { updated: 1 } };
};
