import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { normalizeEditorialText } from '../lib/text';
import { readPublicCache, writePublicCache } from '../lib/publicDataCache';

let cachedCategories = [];
let pendingCategoriesRequest = null;

const DEFAULT_CATEGORY_COLOR = '#2563EB';
const CATEGORY_CACHE_KEY = 'category-catalog-v3';

const FALLBACK_CATEGORY_COLORS = {
  'casa-e-conforto': '#8B5E34',
  cultura: '#D97706',
  educacao: '#7C3AED',
  esporte: '#16A34A',
  empreendedorismo: '#2563EB',
  economia: '#0891B2',
  'lazer-e-turismo': '#EA580C',
  'meio-ambiente': '#65A30D',
  moda: '#DB2777',
  'moda-e-estilo': '#DB2777',
  personalidades: '#C2410C',
  saude: '#059669',
  'saude-e-bem-estar': '#059669',
  tecnologia: '#0EA5E9'
};

const normalizeCategoryKey = (value = '') =>
  normalizeEditorialText(value).trim().toLowerCase();

const hexToRgba = (hex, alpha) => {
  const normalized = hex.replace('#', '');
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((value) => value + value)
          .join('')
      : normalized;

  const red = Number.parseInt(fullHex.slice(0, 2), 16);
  const green = Number.parseInt(fullHex.slice(2, 4), 16);
  const blue = Number.parseInt(fullHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const fetchCategories = async () => {
  if (!HAS_BACKEND) {
    cachedCategories = [];
    return cachedCategories;
  }

  if (!cachedCategories.length) {
    const cachedCatalog = readPublicCache(CATEGORY_CACHE_KEY);
    if (Array.isArray(cachedCatalog) && cachedCatalog.length) {
      cachedCategories = cachedCatalog;
    }
  }

  if (!pendingCategoriesRequest) {
    pendingCategoriesRequest = axios
      .get(apiUrl('/api/categories?active=true'))
      .then((response) => {
        cachedCategories = Array.isArray(response.data) ? response.data : [];
        writePublicCache(CATEGORY_CACHE_KEY, cachedCategories);
        return cachedCategories;
      })
      .catch(() => cachedCategories)
      .finally(() => {
        pendingCategoriesRequest = null;
      });
  }

  return pendingCategoriesRequest;
};

export const resetCategoryCatalogCache = () => {
  cachedCategories = [];
  pendingCategoriesRequest = null;
  writePublicCache(CATEGORY_CACHE_KEY, []);
};

export const useCategoryCatalog = () => {
  const [categories, setCategories] = useState(cachedCategories);

  useEffect(() => {
    let active = true;

    fetchCategories().then((data) => {
      if (active) {
        setCategories(Array.isArray(data) ? data : []);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return categories;
};

export const getCategoryMeta = (postCategory, categories = [], options = {}) => {
  const { categoryId, categorySlug } = options;
  const normalizedPostCategory = normalizeCategoryKey(postCategory);
  const normalizedSlug = normalizeCategoryKey(categorySlug);

  const matchedCategory = categories.find((item) => {
    if (categoryId && item?.id === categoryId) {
      return true;
    }

    if (categorySlug && normalizeCategoryKey(item?.slug) === normalizeCategoryKey(categorySlug)) {
      return true;
    }

    const names = [normalizeCategoryKey(item?.name), normalizeCategoryKey(item?.slug)];
    return names.includes(normalizeCategoryKey(postCategory));
  });

  const fallbackColor =
    FALLBACK_CATEGORY_COLORS[normalizeCategoryKey(matchedCategory?.slug)] ||
    FALLBACK_CATEGORY_COLORS[normalizeCategoryKey(matchedCategory?.name)] ||
    FALLBACK_CATEGORY_COLORS[normalizedSlug] ||
    FALLBACK_CATEGORY_COLORS[normalizedPostCategory] ||
    DEFAULT_CATEGORY_COLOR;

  return {
    key:
      matchedCategory?.id ||
      matchedCategory?.slug ||
      normalizeCategoryKey(postCategory),
    label: normalizeEditorialText(matchedCategory?.name || postCategory || ''),
    color: matchedCategory?.color || fallbackColor
  };
};

const CategoryLabel = ({
  as: Tag = 'span',
  category,
  categoryId,
  categorySlug,
  categories,
  variant = 'text',
  withDot = false,
  className = '',
  ...props
}) => {
  const catalog = useCategoryCatalog();
  const resolvedCategories = categories || catalog;
  const meta = useMemo(
    () => getCategoryMeta(category, resolvedCategories, { categoryId, categorySlug }),
    [category, resolvedCategories, categoryId, categorySlug]
  );

  const style =
    variant === 'pill'
      ? {
          color: meta.color,
          backgroundColor: hexToRgba(meta.color, 0.12),
          borderColor: hexToRgba(meta.color, 0.24)
        }
      : { color: meta.color };

  return (
    <Tag className={className} style={style} {...props}>
      {withDot && (
        <span
          className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
          style={{ backgroundColor: meta.color }}
          aria-hidden="true"
        />
      )}
      {meta.label}
    </Tag>
  );
};

export default CategoryLabel;
