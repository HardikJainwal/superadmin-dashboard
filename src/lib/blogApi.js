const BLOG_API_BASE = 'https://api.devdoot.org/v1/api/blogs';

// ─── Blog CRUD ────────────────────────────────────────────

/**
 * Fetch all blogs, optionally filtered by site.
 * @param {'main'|'new_site'|''} site
 */
export async function fetchBlogs(site = '') {
  const url = site ? `${BLOG_API_BASE}?site=${site}` : BLOG_API_BASE;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch blogs');
  return data;
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
 * Update an existing blog post.
 * @param {string} id - Blog ID
 * @param {object} payload - Fields to update (e.g. { publishTo: ['main','new_site'] })
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
