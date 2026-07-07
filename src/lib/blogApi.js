const BLOG_API_BASE = 'https://api.devdoot.org/v1/api/blogs';

// ─── Blog CRUD ────────────────────────────────────────────

/**
 * Fetch one page of blogs, optionally filtered by site.
 * Returns { blogs: [...], pagination: { page, limit, total } }
 * @param {'main'|'new_site'|''} site
 * @param {number} page  1-based page number
 * @param {number} limit max 50 per the API
 */
export async function fetchBlogs(site = '', page = 1, limit = 50) {
  const params = new URLSearchParams();
  if (site) params.set('site', site);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const url = `${BLOG_API_BASE}?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch blogs');
  // API returns { success, data: { blogs: [...], pagination: { page, limit, total } } }
  return {
    blogs: json.data?.blogs ?? [],
    pagination: json.data?.pagination ?? { page, limit, total: 0 },
  };
}

/**
 * Fetch ALL blogs across all pages (for admin list view).
 * Iterates pages automatically using limit=50 (API max).
 * @param {'main'|'new_site'|''} site
 */
export async function fetchAllBlogs(site = '') {
  const firstPage = await fetchBlogs(site, 1, 50);
  const { blogs, pagination } = firstPage;
  const { total, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return blogs;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetchBlogs(site, i + 2, 50))
  );
  return [...blogs, ...rest.flatMap(r => r.blogs)];
}

/**
 * Fetch a single blog by slug.
 * @param {string} slug
 * @param {'main'|'new_site'|''} site
 */
export async function fetchBlogBySlug(slug, site = '') {
  const url = site
    ? `${BLOG_API_BASE}/slug/${slug}?site=${site}`
    : `${BLOG_API_BASE}/slug/${slug}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Blog not found');
  return data;
}

/**
 * Create a new blog post.
 * @param {object} payload - { title, content, slug, category, imageUrl, seoTitle, metaDescription, keyphrase, imageAlt, publishTo }
 */
export async function createBlog(payload) {
  const res = await fetch(`${BLOG_API_BASE}/blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create blog');
  return data;
}

/**
 * Update an existing blog post (full replace).
 * @param {string} id - Blog ID
 * @param {object} payload - Fields to update
 */
export async function updateBlog(id, payload) {
  const res = await fetch(`${BLOG_API_BASE}/blog/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update blog');
  return data;
}

/**
 * Partially update an existing blog post (PATCH).
 * @param {string} id - Blog ID
 * @param {object} payload - Partial fields to update (e.g. { publishTo, seoTitle, blogPostSchema, ... })
 */
export async function patchBlog(id, payload) {
  const res = await fetch(`${BLOG_API_BASE}/blog/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to patch blog');
  return data;
}

// ─── Category CRUD ────────────────────────────────────────

/**
 * Fetch all categories, optionally filtered by site.
 * @param {'main'|'new_site'|''} site
 */
export async function fetchCategories(site = '') {
  const url = site
    ? `${BLOG_API_BASE}/categories?site=${site}`
    : `${BLOG_API_BASE}/categories`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch categories');
  return data;
}

/**
 * Create a new category.
 * @param {object} payload - { name, image, description, site }
 */
export async function createCategory(payload) {
  const res = await fetch(`${BLOG_API_BASE}/category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create category');
  return data;
}

/**
 * Update an existing category.
 * @param {string} id - Category ID
 * @param {object} payload - Fields to update (e.g. { site: 'new_site' })
 */
export async function updateCategory(id, payload) {
  const res = await fetch(`${BLOG_API_BASE}/category/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update category');
  return data;
}

/**
 * Fetch blogs under a specific category, optionally filtered by site.
 * @param {string} categorySlug
 * @param {'main'|'new_site'|''} site
 */
export async function fetchBlogsByCategory(categorySlug, site = '') {
  const url = site
    ? `${BLOG_API_BASE}/category/${categorySlug}?site=${site}`
    : `${BLOG_API_BASE}/category/${categorySlug}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch blogs by category');
  return data;
}