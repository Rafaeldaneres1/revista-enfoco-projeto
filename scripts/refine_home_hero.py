from pathlib import Path
import re


path = Path(r"C:\Users\daner\OneDrive\Documentos\New project\revista-enfoco-projeto\frontend\src\pages\Home.js")
text = path.read_text(encoding="utf-8")

text = re.sub(
    r"\{activeHeroPost\.featured_image \? \([\s\S]*?\) : \([\s\S]*?\)\}",
    '<div className="w-full h-full bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.28),_transparent_38%),linear-gradient(135deg,_#111827,_#0f172a)]"></div>',
    text,
    count=1,
)

text = text.replace(
    '<div className="absolute inset-0 hero-overlay"></div>',
    '<div className="absolute inset-0 hero-overlay"></div>\n'
    '              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.14),transparent_40%,rgba(17,24,39,0.12))]"></div>',
)

text = text.replace(
    'className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-0"',
    'className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-20 sm:py-24 lg:py-0"',
)
text = text.replace(
    'className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center"',
    'className="max-w-4xl"',
)
text = text.replace(
    'className="animate-slide-up text-white order-2 lg:order-1 max-w-lg"',
    'className="animate-slide-up text-white max-w-4xl"',
)
text = text.replace(
    'className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-8 leading-[1.25] text-balance hero-text-shadow animate-hero-title"',
    'className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 lg:mb-10 leading-[1.08] text-balance hero-text-shadow animate-hero-title max-w-5xl"',
)
text = text.replace(
    'className="text-sm sm:text-base lg:text-base mb-10 max-w-md opacity-90 leading-relaxed font-light animate-hero-excerpt"',
    'className="text-base sm:text-lg lg:text-xl mb-10 lg:mb-12 max-w-2xl opacity-90 leading-relaxed font-light animate-hero-excerpt"',
)
text = text.replace(
    'className="flex flex-col sm:flex-row gap-3 mb-12"',
    'className="flex flex-col sm:flex-row gap-3 mb-10 lg:mb-12"',
)
text = text.replace("Ler MatÃ©ria", "Ler Matéria")
text = text.replace(">Mais<", ">Mais notícias<")
text = text.replace("RedaÃ§Ã£o", "Redação")
text = text.replace(">â€¢<", ">•<")
text = text.replace(
    'className="flex items-center gap-2 text-white/60 text-xs border-t border-white/15 pt-6 animate-slide-up"',
    'className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/60 text-xs border-t border-white/15 pt-6 animate-slide-up max-w-xl"',
)
text = text.replace("RedaÃ§Ã£o", "Redação")
text = text.replace("â€¢", "•")

text = re.sub(
    r"\n\s*\{/\* Imagem Principal - Minimalista \*/\}[\s\S]*?\n\s*\}\n\s*</div>\n\s*</div>\n\s*</div>",
    "\n                </div>\n              </div>\n            </div>",
    text,
    count=1,
)

text = text.replace("TambÃ©m em Destaque", "Também em Destaque")
text = text.replace("Ler MatÃ©ria", "Ler Matéria")
text = text.replace(">Mais<", ">Mais notícias<")
text = re.sub(
    r"\n\s*\{/\* Imagem SecundÃ¡ria \*/\}[\s\S]*?\n\s*\{/\* ConteÃºdo SecundÃ¡rio \*/\}",
    '\n                        <div className="p-5 lg:p-6 flex flex-col flex-1 min-h-[220px]">',
    text,
    count=3,
)
text = text.replace(
    'className="font-display text-sm lg:text-base font-bold text-white mb-2 leading-tight group-hover:text-royal-blue transition-colors duration-200 line-clamp-2"',
    'className="font-display text-lg lg:text-xl font-bold text-white mb-3 leading-tight group-hover:text-royal-blue transition-colors duration-200 line-clamp-3"',
)
text = text.replace(
    'className="text-xs text-white/70 leading-relaxed flex-1 line-clamp-2 mb-3"',
    'className="text-sm text-white/70 leading-relaxed flex-1 line-clamp-3 mb-5"',
)
text = text.replace(
    'className="flex items-center gap-2 mb-2"',
    'className="flex items-center gap-2 mb-3"',
)

path.write_text(text, encoding="utf-8")
