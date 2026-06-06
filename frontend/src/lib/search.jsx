export const normalizeSearchText = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const matchesSearch = (item, fields = [], query = '') => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return fields.some((field) => normalizeSearchText(field(item)).includes(normalizedQuery));
};
