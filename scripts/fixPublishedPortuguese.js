const API_BASE = 'http://127.0.0.1:8001/api';
const LOGIN_EMAIL = 'admin@enfoco.com';
const LOGIN_PASSWORD = 'Enfoco@2026';

const ACCENTLESS_POST_SLUGS = new Set([
  'a-balanca-dos-pets',
  'piscicultura-avanca-no-brasil-e-revela-potencial-ainda-pouco-explorado-no-rs',
  'energia-para-empreender-daiane-titon-a-mulher-por-tras-da-baly',
  'da-praia-para-a-quadra',
  'empresas-tem-ate-26-de-maio-para-se-adequar-as-novas-exigencias-da-nr-1',
]);

const REPLACEMENTS = [
  ['mulher por tras', 'mulher por trás'],
  ['Da visao de lideranca', 'Da visão de liderança'],
  ['Daiane Titon', 'Daiane Titon'],
  ['visao', 'visão'],
  ['lideranca', 'liderança'],
  ['historia', 'história'],
  ['historica', 'histórica'],
  ['históricas', 'históricas'],
  ['nao', 'não'],
  ['ja', 'já'],
  ['tambem', 'também'],
  ['tambem', 'também'],
  ['so', 'só'],
  ['tras', 'trás'],
  ['ate', 'até'],
  ['familia', 'família'],
  ['irmao', 'irmão'],
  ['decada', 'década'],
  ['cachacas', 'cachaças'],
  ['producao', 'produção'],
  ['lancando', 'lançando'],
  ['estrategia', 'estratégia'],
  ['inovacao', 'inovação'],
  ['economicas', 'econômicas'],
  ['epoca', 'época'],
  ['maquina', 'máquina'],
  ['limitacao', 'limitação'],
  ['aceitacao', 'aceitação'],
  ['distribuicao', 'distribuição'],
  ['voce', 'você'],
  ['energia e equilibrio', 'Energia e equilíbrio'],
  ['equilibrio', 'equilíbrio'],
  ['milhoes', 'milhões'],
  ['abracar', 'abraçar'],
  ['frenetica', 'frenética'],
  ['diferenca', 'diferença'],
  ['numeros', 'números'],
  ['marco', 'março'],
  ['participacao', 'participação'],
  ['projecao', 'projeção'],
  ['energeticos', 'energéticos'],
  ['lider absoluta', 'líder absoluta'],
  ['tragedia', 'tragédia'],
  ['bracos', 'braços'],
  ['agua', 'água'],
  ['milhao', 'milhão'],
  ['caminhoes', 'caminhões'],
  ['alem', 'além'],
  ['gauchos', 'gaúchos'],
  ['gaucho', 'gaúcho'],
  ['edicao', 'edição'],
  ['reconstrucao', 'reconstrução'],
  ['balanca', 'balança'],
  ['caes', 'cães'],
  ['veterinarios', 'veterinários'],
  ['alimentacao', 'alimentação'],
  ['espaco', 'espaço'],
  ['fisica', 'física'],
  ['estimacao', 'estimação'],
  ['doenca', 'doença'],
  ['acumulo', 'acúmulo'],
  ['necessario', 'necessário'],
  ['reducao', 'redução'],
  ['desequilibrio', 'desequilíbrio'],
  ['medica', 'médica'],
  ['racao', 'ração'],
  ['disponivel', 'disponível'],
  ['estimulos', 'estímulos'],
  ['diario', 'diário'],
  ['refeicoes', 'refeições'],
  ['Associacao', 'Associação'],
  ['prejuizos', 'prejuízos'],
  ['saude', 'saúde'],
  ['alteracoes', 'alterações'],
  ['disturbios', 'distúrbios'],
  ['hepaticas', 'hepáticas'],
  ['figado', 'fígado'],
  ['hipertensao', 'hipertensão'],
  ['prevencao', 'prevenção'],
  ['atencao', 'atenção'],
  ['cenario', 'cenário'],
  ['estomago', 'estômago'],
  ['calorico', 'calórico'],
  ['refeicao', 'refeição'],
  ['beneficios', 'benefícios'],
  ['proprios', 'próprios'],
  ['habitos', 'hábitos'],
  ['diferencas', 'diferenças'],
  ['suplementacao', 'suplementação'],
  ['vitaminica', 'vitamínica'],
  ['consultorio', 'consultório'],
  ['calcio', 'cálcio'],
  ['avanca', 'avança'],
  ['qualificacao', 'qualificação'],
  ['comeca', 'começa'],
  ['propria', 'própria'],
  ['diagnostico', 'diagnóstico'],
  ['reforcou', 'reforçou'],
  ['territorio', 'território'],
  ['assistencia', 'assistência'],
  ['numero', 'número'],
  ['Parana', 'Paraná'],
  ['tecnicos', 'técnicos'],
  ['profissionalizacao', 'profissionalização'],
  ['genetica', 'genética'],
  ['rapido', 'rápido'],
  ['files', 'filés'],
  ['especies', 'espécies'],
  ['especie', 'espécie'],
  ['jundia', 'jundiá'],
  ['Nutricao', 'Nutrição'],
  ['eficiencia', 'eficiência'],
  ['racoes', 'rações'],
  ['desperdicios', 'desperdícios'],
  ['variacoes', 'variações'],
  ['amonia', 'amônia'],
  ['proteinas', 'proteínas'],
  ['economico', 'econômico'],
  ['adocao', 'adoção'],
  ['condicoes', 'condições'],
  ['favoraveis', 'favoráveis'],
  ['expansao', 'expansão'],
  ['Atualizacao', 'Atualização'],
  ['organizacoes', 'organizações'],
  ['seguranca', 'segurança'],
  ['Ministerio', 'Ministério'],
  ['evolucao', 'evolução'],
  ['gestao', 'gestão'],
  ['Saude', 'Saúde'],
  ['redacao', 'redação'],
  ['situacoes', 'situações'],
  ['relevancia', 'relevância'],
  ['sindrome', 'síndrome'],
  ['Adequacao', 'Adequação'],
  ['identificacao', 'identificação'],
  ['avaliacao', 'avaliação'],
  ['juridicas', 'jurídicas'],
  ['fiscalizacoes', 'fiscalizações'],
  ['acoes', 'ações'],
  ['Justica', 'Justiça'],
  ['protecao', 'proteção'],
  ['indenizacoes', 'indenizações'],
  ['razao', 'razão'],
  ['negligencia', 'negligência'],
  ['poderao', 'poderão'],
  ['adaptacao', 'adaptação'],
  ['quadras disponiveis', 'quadras disponíveis'],
  ['futevolei', 'futevôlei'],
  ['reune', 'reúne'],
  ['opcao', 'opção'],
  ['socializacao', 'socialização'],
  ['tecnica', 'técnica'],
  ['dinamica do volei', 'dinâmica do vôlei'],
  ['cenarios', 'cenários'],
  ['atraves', 'através'],
  ['vinculos', 'vínculos'],
  ['adversaria', 'adversária'],
  ['esforco', 'esforço'],
  ['coordenacao', 'coordenação'],
  ['lesoes', 'lesões'],
  ['habito', 'hábito'],
  ['planejámento', 'planejamento'],
  ['sócial', 'social'],
  ['sócialização', 'socialização'],
  ['consólida', 'consolida'],
  ['sóbe', 'sobe'],
  ['psicossóciais', 'psicossociais'],
  ['Títon', 'Titon'],
  ['Tubarao', 'Tubarão'],
  ['industria', 'indústria'],
  ['negocio', 'negócio'],
  ['famíliar', 'familiar'],
  ['Empresas tem até', 'Empresas têm até'],
  ['as novas exigencias', 'às novas exigências'],
  ['responsabilizacao', 'responsabilização'],
  ['socio da Celestino', 'sócio da Celestino'],
  ['atuacao preventiva', 'atuação preventiva'],
  ['fisicos, quimicos ou ergonomicos', 'físicos, químicos ou ergonômicos'],
  ['pressao excessiva', 'pressão excessiva'],
  ['saude mental no pais', 'saúde mental no país'],
  ['diagnostico das atividades', 'diagnóstico das atividades'],
  ['inventario de riscos ocupacionais', 'inventário de riscos ocupacionais'],
  ['Analise Ergonomica do Trabalho', 'Análise Ergonômica do Trabalho'],
  ['revisao de praticas de gestao', 'revisão de práticas de gestão'],
  ['nao adequacao', 'não adequação'],
  ['alem de pensao mensal', 'além de pensão mensal'],
  ['acoes regressivas', 'ações regressivas'],
  ['orgao busca', 'órgão busca'],
  ['maiores serao', 'maiores serão'],
  ['riscos juridicos', 'riscos jurídicos'],
  ['Alem do aspecto esportivo', 'Além do aspecto esportivo'],
  ['beneficios a saude fisica e mental', 'benefícios à saúde física e mental'],
  ['convivencia', 'convivência'],
  ['introducao correta', 'introdução correta'],
  ['rapidas', 'rápidas'],
  ['mudancas', 'mudanças'],
  ['esta', 'está'],
  ['pais', 'país'],
  ['Servicos:', 'Serviços:'],
  ['Espaco do servico:', 'Espaço do serviço:'],
  ['Numero:', 'Número:'],
  ['Credito da foto', 'Crédito da foto'],
  ['consequencias juridicas', 'consequências jurídicas'],
  ['Adequacao exige diagnostico e planejamento', 'Adequação exige diagnóstico e planejamento'],
  ['Saude mental entra no radar das empresas', 'Saúde mental entra no radar das empresas'],
  ['Producao ainda limitada', 'Produção ainda limitada'],
  ['Nutricao e manejo', 'Nutrição e manejo'],
  ['Uma nova forma de alimentar os pets', 'Uma nova forma de alimentar os pets'],
];

function preserveCase(source, replacement) {
  if (!source) {
    return replacement;
  }

  if (source.toUpperCase() === source) {
    return replacement.toUpperCase();
  }

  if (source[0].toUpperCase() === source[0]) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement;
}

function fixMojibake(value) {
  if (typeof value !== 'string' || !/[ÃÂ]|â|�/.test(value)) {
    return value;
  }

  let current = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const decoded = Buffer.from(current, 'latin1').toString('utf8');
    if (decoded === current) {
      break;
    }

    current = decoded;
    if (!/[ÃÂ]|â|�/.test(current)) {
      break;
    }
  }

  return current;
}

function fixAccentlessPortuguese(value) {
  if (typeof value !== 'string') {
    return value;
  }

  let nextValue = value;
  for (const [from, to] of REPLACEMENTS) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const useBoundaries = /^[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*$/.test(from);
    const pattern = useBoundaries ? `\\b${escaped}\\b` : escaped;
    nextValue = nextValue.replace(new RegExp(pattern, 'gi'), (match) => preserveCase(match, to));
  }

  return nextValue;
}

function normalizeWhitespace(value) {
  return value
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fixText(value, options = {}) {
  if (typeof value !== 'string') {
    return value;
  }

  let nextValue = fixMojibake(value);

  if (options.restoreAccents) {
    nextValue = fixAccentlessPortuguese(nextValue);
  }

  return normalizeWhitespace(nextValue);
}

function stripMetaFields(record) {
  const clone = { ...record };
  delete clone.id;
  delete clone.slug;
  delete clone.created_at;
  delete clone.updated_at;
  delete clone.author_id;
  return clone;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  return data;
}

async function login() {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    }),
  });

  return data.access_token;
}

function buildPostPayload(post) {
  return {
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    category: post.category,
    category_id: post.category_id ?? null,
    category_slug: post.category_slug ?? null,
    featured_image: post.featured_image ?? null,
    image_position: post.image_position ?? null,
    author_name: post.author_name ?? null,
    destaque_principal_home: Boolean(post.destaque_principal_home),
    destaque_secundario_home: Boolean(post.destaque_secundario_home),
    ordem_destaque: Number(post.ordem_destaque || 0),
    published: Boolean(post.published),
  };
}

function buildColumnPayload(column) {
  return {
    title: column.title,
    content: column.content,
    excerpt: column.excerpt,
    featured_image: column.featured_image ?? null,
    image_position: column.image_position ?? null,
    columnist_id: column.columnist_id ?? null,
    author_name: column.author_name ?? null,
    author_role: column.author_role ?? null,
    author_bio: column.author_bio ?? null,
    author_image: column.author_image ?? null,
    published: Boolean(column.published),
  };
}

function buildEditionPayload(edition) {
  return {
    title: edition.title,
    description: edition.description,
    cover_image: edition.cover_image ?? null,
    edition_number: Number(edition.edition_number),
    pdf_url: edition.pdf_url ?? null,
    page_count: edition.page_count ?? null,
    pages_base_path: edition.pages_base_path ?? null,
    preview_pages: Array.isArray(edition.preview_pages) ? edition.preview_pages : [],
    published: Boolean(edition.published),
  };
}

function buildTeamPayload(member) {
  return {
    name: member.name,
    role: member.role,
    image: member.image ?? null,
    bio: member.bio,
    display_order: Number(member.display_order || 0),
    published: Boolean(member.published),
  };
}

function updateFields(target, fieldNames, options = {}) {
  let changed = false;

  for (const fieldName of fieldNames) {
    const currentValue = target[fieldName];
    const nextValue = fixText(currentValue, options);
    if (typeof currentValue === 'string' && nextValue !== currentValue) {
      target[fieldName] = nextValue;
      changed = true;
    }
  }

  return changed;
}

async function main() {
  const token = await login();
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const summary = [];

  const posts = await apiFetch('/posts?published=true');
  for (const post of posts) {
    const candidate = { ...post };
    let changed = false;

    if (ACCENTLESS_POST_SLUGS.has(post.slug)) {
      changed = updateFields(candidate, ['title', 'excerpt', 'content', 'category', 'author_name'], {
        restoreAccents: true,
      }) || changed;
    } else {
      changed = updateFields(candidate, ['title', 'excerpt', 'content', 'category', 'author_name']) || changed;
    }

    if (changed) {
      const payload = buildPostPayload(candidate);
      await apiFetch(`/posts/${post.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      summary.push(`post:${post.slug}`);
    }
  }

  const columns = await apiFetch('/columns?published=true');
  for (const column of columns) {
    const candidate = { ...column };
    const changed = updateFields(candidate, ['title', 'excerpt', 'content', 'author_name', 'author_role', 'author_bio']);

    if (changed) {
      const payload = buildColumnPayload(candidate);
      await apiFetch(`/columns/${column.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      summary.push(`column:${column.slug}`);
    }
  }

  const about = await apiFetch('/about');
  const aboutCandidate = { ...about };
  let aboutChanged = false;
  aboutChanged = updateFields(aboutCandidate, [
    'location',
    'eyebrow',
    'hero_title',
    'intro',
    'mission',
    'team_title',
    'team_description',
    'contact_title',
    'contact_description',
    'contact_city',
  ]) || aboutChanged;
  aboutCandidate.paragraphs = (aboutCandidate.paragraphs || []).map((paragraph) => fixText(paragraph));
  aboutCandidate.values = (aboutCandidate.values || []).map((item) => ({
    ...item,
    title: fixText(item.title),
    description: fixText(item.description),
  }));
  aboutCandidate.social = {
    ...(aboutCandidate.social || {}),
    instagram: fixText(aboutCandidate.social?.instagram || ''),
    facebook: fixText(aboutCandidate.social?.facebook || ''),
    linkedin: fixText(aboutCandidate.social?.linkedin || ''),
  };
  aboutChanged =
    aboutChanged ||
    JSON.stringify(stripMetaFields(aboutCandidate)) !== JSON.stringify(stripMetaFields(about));

  if (aboutChanged) {
    await apiFetch('/about', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(stripMetaFields(aboutCandidate)),
    });
    summary.push('about');
  }

  const homeSettings = await apiFetch('/home-settings');
  const homeCandidate = { ...homeSettings };
  const homeChanged = updateFields(homeCandidate, [
    'hero_primary_cta_label',
    'hero_secondary_cta_label',
    'hero_secondary_label',
    'featured_edition_label',
    'featured_edition_title',
    'featured_edition_primary_cta_label',
    'featured_edition_secondary_cta_label',
    'recommended_label',
    'recommended_title_prefix',
    'recommended_title_emphasis',
    'recommended_link_label',
    'recommended_empty_message',
    'archive_label',
    'archive_title',
    'archive_description',
    'archive_primary_cta_label',
    'archive_secondary_cta_label',
    'archive_empty_message',
    'columns_label',
    'columns_title',
    'columns_description',
    'columns_link_label',
    'columns_empty_message',
  ]);

  if (homeChanged) {
    await apiFetch('/home-settings', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(stripMetaFields(homeCandidate)),
    });
    summary.push('home-settings');
  }

  const editions = await apiFetch('/editions?published=true');
  for (const edition of editions) {
    const candidate = { ...edition };
    const changed = updateFields(candidate, ['title', 'description']);

    if (changed) {
      const payload = buildEditionPayload(candidate);
      await apiFetch(`/editions/${edition.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      summary.push(`edition:${edition.slug}`);
    }
  }

  const team = await apiFetch('/team?published=true');
  for (const member of team) {
    const candidate = { ...member };
    const changed = updateFields(candidate, ['name', 'role', 'bio']);

    if (changed) {
      const payload = buildTeamPayload(candidate);
      await apiFetch(`/team/${member.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      summary.push(`team:${member.id}`);
    }
  }

  console.log(JSON.stringify({ updated: summary }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
