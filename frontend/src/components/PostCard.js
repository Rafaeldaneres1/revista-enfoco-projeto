import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CategoryLabel from './CategoryLabel';
import SafeImage from './SafeImage';

const PostCard = ({ post }) => {
  return (
    <article className="group cursor-pointer animate-scale-in">
      {post.featured_image && (
        <Link to={`/noticias/${post.slug}`} className="block overflow-hidden">
          <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-6 shadow-premium-sm group-hover:shadow-premium transition-all duration-500">
            <SafeImage
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-700 ease-out"
            />
          </div>
        </Link>
      )}
      <div className="space-y-4">
        <CategoryLabel
          category={post.category}
          categoryId={post.category_id}
          categorySlug={post.category_slug}
          className="inline-block text-xs font-sans tracking-[0.2em] uppercase font-semibold letter-spacing-tight"
        />
        <Link to={`/noticias/${post.slug}`}>
          <h3 className="font-display text-xl lg:text-2xl font-bold leading-tight text-charcoal group-hover:text-royal-blue transition-colors duration-300" style={{ letterSpacing: '-0.02em' }}>
            {post.title}
          </h3>
        </Link>
        <p className="text-stone text-sm leading-relaxed line-clamp-2 text-opacity-80">{post.excerpt}</p>
        <div className="flex items-center gap-3 text-xs text-stone pt-3 border-t border-gray-200/50">
          <span className="font-medium text-charcoal/80">{post.author_name}</span>
          <span className="text-gray-300">•</span>
          <time className="text-opacity-70">{format(new Date(post.created_at), "d 'de' MMM, yyyy", { locale: ptBR })}</time>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
