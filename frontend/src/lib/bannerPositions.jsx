export const BANNER_POSITIONS = [
  {
    value: 'home_after_highlights',
    label: 'Home: entre Também em Destaques e Artigos em Destaque'
  },
  {
    value: 'home_before_editions',
    label: 'Home: entre Colunas em Destaque e Edições para navegar'
  },
  {
    value: 'posts_after_filters',
    label: 'Reportagens: abaixo da busca e categorias'
  },
  {
    value: 'columns_after_hero',
    label: 'Colunas: abaixo do cabeçalho'
  },
  {
    value: 'events_after_hero',
    label: 'Eventos: abaixo do cabeçalho'
  },
  {
    value: 'editions_after_hero',
    label: 'Revista: abaixo do cabeçalho'
  },
  {
    value: 'article_middle',
    label: 'Matérias/Colunas internas: meio do conteúdo'
  },
  {
    value: 'article_footer',
    label: 'Matérias/Colunas internas: final do conteúdo'
  }
];

export const getBannerPositionLabel = (position) =>
  BANNER_POSITIONS.find((item) => item.value === position)?.label || position;
