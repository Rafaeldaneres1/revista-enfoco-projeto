// Mock data central para toda a aplicação
export const posts = [
  {
    id: "1",
    slug: "cultura-arte-contemporanea",
    title: "Cultura e Arte Contemporânea",
    excerpt: "Um olhar sobre a arte do século XXI",
    content: `A arte contemporânea brasileira vive um momento de efervescência sem precedentes. 

Das periferias aos grandes centros urbanos, uma nova geração de artistas está redefinindo os limites da criação, questionando estruturas de poder e trazendo à tona narrativas historicamente silenciadas.

## O Movimento das Periferias

Nos últimos anos, coletivos artísticos surgidos em favelas e bairros periféricos de São Paulo, Rio de Janeiro e outras metrópoles têm ganhado reconhecimento internacional. Suas obras, que transitam entre grafite, instalações e performances, carregam a potência de quem vive e cria a partir das margens.

## Tecnologia e Tradição

Outro fenômeno interessante é a fusão entre técnicas ancestrais e tecnologias digitais. Artistas indígenas, por exemplo, têm utilizado realidade aumentada e NFTs para preservar e difundir suas culturas, criando pontes entre tradição e inovação.

## O Mercado em Transformação

Galerias tradicionais começam a reconhecer a necessidade de democratizar o acesso à arte. Novos modelos de negócio surgem, incluindo cooperativas de artistas e plataformas digitais que conectam criadores diretamente ao público.

A arte contemporânea brasileira não é mais privilégio de poucos. É um movimento vivo, pulsante e profundamente conectado com as questões do nosso tempo.`,
    category: "Cultura",
    featured_image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1200",
    author_id: "1",
    author_name: "Marina Silva",
    published: true,
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z"
  },
  {
    id: "2",
    slug: "tecnologia-ia-futuro",
    title: "O Futuro da Inteligência Artificial",
    excerpt: "Como a IA está transformando nosso cotidiano",
    content: `A inteligência artificial deixou de ser ficção científica para se tornar parte integral do nosso dia a dia. De assistentes virtuais a sistemas de recomendação, a IA está moldando a forma como vivemos, trabalhamos e nos relacionamos.

## Aplicações Práticas

Hoje, algoritmos de IA auxiliam médicos em diagnósticos mais precisos, otimizam rotas de entrega para reduzir emissões de carbono e personalizam experiências educacionais para milhões de estudantes ao redor do mundo.

## Desafios Éticos

Mas com grande poder vem grande responsabilidade. Questões sobre privacidade, viés algorítmico e o futuro do trabalho exigem debates urgentes e regulamentações adequadas.

## O Papel do Brasil

O Brasil tem potencial para se tornar referência em IA ética e inclusiva, aproveitando nossa diversidade cultural e expertise em tecnologia para desenvolver soluções que beneficiem toda a sociedade.`,
    category: "Tecnologia",
    featured_image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200",
    author_id: "2",
    author_name: "Carlos Mendes",
    published: true,
    created_at: "2026-03-14T15:30:00Z",
    updated_at: "2026-03-14T15:30:00Z"
  },
  {
    id: "3",
    slug: "moda-sustentavel-brasil",
    title: "Moda Sustentável: O Novo Luxo",
    excerpt: "Marcas brasileiras lideram movimento pela sustentabilidade",
    content: `O conceito de luxo está mudando. Se antes significava exclusividade a qualquer custo, hoje o verdadeiro luxo está em consumir de forma consciente, valorizando a origem dos materiais e o impacto ambiental e social da produção.

## Pioneiros Brasileiros

Marcas brasileiras estão na vanguarda desse movimento. Utilizando tecidos orgânicos, tingimentos naturais e processos que respeitam tanto o meio ambiente quanto os trabalhadores, elas provam que é possível criar moda de alta qualidade sem comprometer valores éticos.

## Upcycling e Economia Circular

O upcycling - transformação de resíduos em produtos de valor - ganhou força. Estilistas criam peças únicas a partir de sobras de tecido, jeans descartados e até redes de pesca recolhidas do oceano.

## Consumidor Consciente

O público também mudou. Pesquisas mostram que a nova geração de consumidores prioriza marcas transparentes sobre sua cadeia produtiva e está disposta a pagar mais por produtos sustentáveis.`,
    category: "Moda",
    featured_image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200",
    author_id: "3",
    author_name: "Julia Rodrigues",
    published: true,
    created_at: "2026-03-13T09:15:00Z",
    updated_at: "2026-03-13T09:15:00Z"
  },
  {
    id: "4",
    slug: "gastronomia-cerrado",
    title: "Gastronomia de Vanguarda no Cerrado",
    excerpt: "Chefs valorizam ingredientes nativos brasileiros",
    content: `O Cerrado, segundo maior bioma brasileiro, está ganhando protagonismo na alta gastronomia. Chefs renomados descobrem nos frutos e raízes nativos uma infinidade de sabores inexplorados, criando uma culinária única que celebra nossa biodiversidade.

## Ingredientes Esquecidos

Pequi, baru, cagaita, gueroba - ingredientes que sempre fizeram parte da alimentação de comunidades tradicionais agora chegam aos restaurantes mais sofisticados do país, valorizados por suas propriedades nutricionais e sabores marcantes.

## Valorização do Produtor Local

Esse movimento fortalece a agricultura familiar e incentiva a conservação ambiental. Ao criar demanda por produtos nativos, os chefs contribuem para que produtores locais tenham uma alternativa econômica à conversão de áreas naturais em monoculturas.

## Identidade Culinária Brasileira

Mais do que uma tendência gastronômica, trata-se da construção de uma identidade culinária autenticamente brasileira, que reconhece e celebra nossa riqueza natural e cultural.`,
    category: "Gastronomia",
    featured_image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200",
    author_id: "1",
    author_name: "Marina Silva",
    published: true,
    created_at: "2026-03-12T14:20:00Z",
    updated_at: "2026-03-12T14:20:00Z"
  }
];

export const columns = [
  {
    id: "1",
    slug: "reflexoes-futuro",
    title: "Reflexões sobre o Futuro",
    excerpt: "Pensamentos sobre nosso tempo e futuro",
    content: `Vivemos em uma época de transformações aceleradas. A cada dia, novas tecnologias emergem, paradigmas são questionados e certezas do passado se dissolvem no ar.

## O Paradoxo da Conexão

Nunca estivemos tão conectados, mas nunca nos sentimos tão isolados. As redes sociais prometeram aproximar pessoas, mas muitas vezes nos afastam das relações genuínas, substituindo conversas profundas por interações superficiais.

## Sustentabilidade como Urgência

A crise climática não é mais uma ameaça distante. É real, presente e exige ação imediata. Felizmente, vemos cada vez mais pessoas e organizações assumindo responsabilidade, repensando modelos de consumo e produção.

## Educação para o Futuro

Nosso sistema educacional precisa se reinventar. Não basta ensinar conteúdos; é preciso desenvolver pensamento crítico, criatividade e habilidades socioemocionais que preparem as novas gerações para um mundo em constante mudança.

## Otimismo Cauteloso

Apesar dos desafios, sou otimista. A história nos mostra que a humanidade é capaz de superar crises quando se une em torno de objetivos comuns. O futuro que construiremos depende das escolhas que fazemos hoje.`,
    featured_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
    author_id: "2",
    author_name: "Carlos Mendes",
    published: true,
    created_at: "2026-03-16T08:00:00Z",
    updated_at: "2026-03-16T08:00:00Z"
  },
  {
    id: "2",
    slug: "democracia-participacao",
    title: "Democracia e Participação Cidadã",
    excerpt: "O papel da sociedade civil na construção democrática",
    content: `A democracia não é um estado permanente, mas um processo contínuo que exige participação ativa da sociedade. Em tempos de polarização e desinformação, fortalecer os mecanismos de participação cidadã torna-se ainda mais crucial.

## Além do Voto

Votar é importante, mas a democracia não se resume às eleições. Conselhos participativos, audiências públicas, orçamento participativo e outras ferramentas permitem que cidadãos influenciem diretamente políticas públicas.

## Transparência e Accountability

A tecnologia pode ser aliada da democracia. Plataformas digitais facilitam o acesso a informações sobre gastos públicos, permitem o acompanhamento de votações e conectam eleitores a seus representantes.

## Educação Política

Precisamos de mais educação política, não partidária. Cidadãos bem informados sobre como funcionam as instituições democráticas são mais capazes de participar ativamente e exigir responsabilidade de seus representantes.

## Sociedade Civil Organizada

ONGs, coletivos e movimentos sociais desempenham papel fundamental na defesa de direitos e na proposição de soluções para problemas sociais. Fortalecer a sociedade civil é fortalecer a democracia.`,
    featured_image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200",
    author_id: "3",
    author_name: "Julia Rodrigues",
    published: true,
    created_at: "2026-03-11T11:30:00Z",
    updated_at: "2026-03-11T11:30:00Z"
  }
];

export const events = [
  {
    id: "1",
    slug: "feira-livro-2026",
    title: "Feira do Livro de São Paulo 2026",
    description: "A maior feira literária da América Latina retorna com programação especial celebrando autores brasileiros contemporâneos. Debates, lançamentos e encontros com escritores.",
    event_date: "2026-08-15T10:00:00Z",
    location: "Anhembi Parque, São Paulo - SP",
    published: true,
    created_at: "2026-03-10T10:00:00Z",
    updated_at: "2026-03-10T10:00:00Z"
  },
  {
    id: "2",
    slug: "bienal-arte-sp",
    title: "35ª Bienal de Arte de São Paulo",
    description: "Mostra reúne mais de 200 artistas de 50 países, com foco em arte contemporânea e questões socioambientais. Curadoria explora a relação entre arte, natureza e tecnologia.",
    event_date: "2026-09-20T10:00:00Z",
    location: "Pavilhão da Bienal, Parque Ibirapuera - SP",
    published: true,
    created_at: "2026-03-09T14:00:00Z",
    updated_at: "2026-03-09T14:00:00Z"
  },
  {
    id: "3",
    slug: "festival-cinema-gramado",
    title: "Festival de Cinema de Gramado",
    description: "O mais tradicional festival de cinema do Brasil exibe produções nacionais e internacionais, com premiação e homenagens a cineastas consagrados.",
    event_date: "2026-10-10T18:00:00Z",
    location: "Gramado - RS",
    published: true,
    created_at: "2026-03-08T09:00:00Z",
    updated_at: "2026-03-08T09:00:00Z"
  }
];

export const editions = [
  {
    id: "1",
    slug: "edicao-marco-2026",
    title: "Edição Março 2026",
    description: "Nesta edição especial, exploramos o futuro da cultura brasileira através de entrevistas exclusivas com artistas, pensadores e inovadores que estão moldando nosso tempo.",
    edition_number: 42,
    cover_image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
    pdf_url: "#",
    published: true,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z"
  },
  {
    id: "2",
    slug: "edicao-fevereiro-2026",
    title: "Edição Fevereiro 2026",
    description: "Carnaval, sustentabilidade e tecnologia: como a maior festa popular do Brasil abraça inovação e responsabilidade ambiental.",
    edition_number: 41,
    cover_image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800",
    pdf_url: "#",
    published: true,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z"
  }
];

export const teamMembers = [
  {
    id: "1",
    name: "Marina Silva",
    role: "Editora-Chefe",
    bio: "Jornalista com 15 anos de experiência em redações de grandes veículos. Especialista em cultura e sociedade.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
  },
  {
    id: "2",
    name: "Carlos Mendes",
    role: "Editor de Tecnologia",
    bio: "Formado em Ciências da Computação, atua como jornalista especializado em inovação e transformação digital.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    id: "3",
    name: "Julia Rodrigues",
    role: "Editora de Estilo",
    bio: "Jornalista de moda e lifestyle, com passagens por revistas nacionais e internacionais.",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
  }
];
