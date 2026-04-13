import React from 'react';
import PremiumPostCard from './PremiumPostCard';

const PremiumPostsGrid = ({ posts = [] }) => {
  if (!posts || posts.length === 0) {
    return <div className="text-center py-12 text-stone">Nenhuma notícia disponível</div>;
  }

  // Organizar posts em layout assimétrico
  // Primeiro post é grande (featured), depois alternamos tamanhos
  const organizedPosts = posts.map((post, index) => {
    if (index === 0) {
      return { ...post, size: 'large', featured: true };
    }
    if (index % 3 === 1) {
      return { ...post, size: 'medium' };
    }
    if (index % 3 === 2) {
      return { ...post, size: 'medium' };
    }
    return { ...post, size: 'small' };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-max">
      {organizedPosts.map((post, index) => (
        <PremiumPostCard
          key={post.id || index}
          post={post}
          size={post.size}
          featured={post.featured}
          parallaxEnabled={post.enableParallax !== false}
          animationDelay={post.animationDelay || index * 0.1}
        />
      ))}
    </div>
  );
};

export default PremiumPostsGrid;
