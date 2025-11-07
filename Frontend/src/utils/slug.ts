export const createSlug = (value: string): string => {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const buildProductPath = (id: string, name?: string): string => {
  const slug = name ? createSlug(name) : '';
  return slug ? `/products/${id}/${slug}` : `/products/${id}`;
};
