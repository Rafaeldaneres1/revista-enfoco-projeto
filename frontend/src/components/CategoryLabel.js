import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { normalizeEditorialText } from '../lib/text';

let cachedCategories = [];
let pendingCategoriesRequest = null;

const DEFAULT_CATEGORY_COLOR = '#2563EB';

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

  if (!pendingCategoriesRequest) {
    pendingCategoriesRequest = axios
      .get(apiUrl('/api/categories?active=true'))
      .then((response) => {
        cachedCategories = Array.isArray(response.data) ? response.data : [];
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

  return {
    key:
      matchedCategory?.id ||
      matchedCategory?.slug ||
      normalizeCategoryKey(postCategory),
    label: normalizeEditorialText(matchedCategory?.name || postCategory || ''),
    color: matchedCategory?.color || DEFAULT_CATEGORY_COLOR
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
