'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Eye, Send, Plus, X, Loader2, ImageIcon, Tag, Globe, Monitor, Layout,
  FileText, List, FolderOpen, Edit3, Check, ChevronDown, ExternalLink, RefreshCw,
  Search, Filter, Save, AlertCircle, Code2, ChevronUp
} from 'lucide-react';

import {
  fetchAllBlogs, createBlog, updateBlog, patchBlog,
  fetchCategories as apiFetchCategories, createCategory, updateCategory
} from '@/lib/blogApi';
import { formatCoachTimings } from '@/lib/assignCoach';


const BLOG_API_BASE = 'https://api.devdoot.org/v1/api/blogs';

// ─── Constants ────────────────────────────────────────────
const SITE_OPTIONS = [
  { value: 'main', label: 'Main Website', icon: Monitor, color: 'indigo' },
  { value: 'new_site', label: 'New Website', icon: Globe, color: 'emerald' },
];

const CATEGORY_SITE_OPTIONS = [
  { value: 'both', label: 'Both Websites', icon: Layout },
  { value: 'main', label: 'Main Website Only', icon: Monitor },
  { value: 'new_site', label: 'New Website Only', icon: Globe },
];

// ─── Reusable: Publish-To Checkbox Group ──────────────────
function PublishToSelector({ value = ['main'], onChange }) {
  const toggle = (site) => {
    const current = [...value];
    if (current.includes(site)) {
      if (current.length > 1) onChange(current.filter(s => s !== site));
    } else {
      onChange([...current, site]);
    }
  };
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        Publish To <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-3">
        {SITE_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const active = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium
                ${active
                  ? opt.color === 'indigo'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
                    : 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <span className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all
                ${active
                  ? opt.color === 'indigo'
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-300 bg-white'}`}>
                {active && <Check size={12} className="text-white" />}
              </span>
              <Icon size={16} />
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Select one or both websites where this blog will appear
      </p>
    </div>
  );
}

// ─── Reusable: Site Badge ─────────────────────────────────
function SiteBadge({ sites, size = 'sm' }) {
  const arr = Array.isArray(sites) ? sites : [sites || 'main'];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <div className="flex flex-wrap gap-1.5">
      {arr.map(s => (
        <span
          key={s}
          className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}
            ${s === 'main'
              ? 'bg-indigo-100 text-indigo-700'
              : s === 'new_site'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-purple-100 text-purple-700'
            }`}
        >
          {s === 'main' ? <Monitor size={size === 'sm' ? 10 : 12} /> : s === 'new_site' ? <Globe size={size === 'sm' ? 10 : 12} /> : <Layout size={size === 'sm' ? 10 : 12} />}
          {s === 'main' ? 'Main' : s === 'new_site' ? 'New Site' : 'Both'}
        </span>
      ))}
    </div>
  );
}

// ─── Reusable: Category Site Selector ─────────────────────
function CategorySiteSelector({ value = 'both', onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        Site Visibility
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {CATEGORY_SITE_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                ${active
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
            >
              <Icon size={14} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}



// ─── Reusable: JSON Schema Editor ────────────────────────
function SchemaJsonEditor({ label, value, onChange, placeholder }) {
  const [raw, setRaw] = useState(
    value ? (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) : ''
  );
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(true);

  const handleChange = (text) => {
    setRaw(text);
    if (!text.trim()) {
      setError(null);
      onChange(null);
      return;
    }
    try {
      onChange(JSON.parse(text));
      setError(null);
    } catch {
      setError('Invalid JSON');
      onChange(null);
    }
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Code2 size={14} className="text-indigo-500" />
          {label}
          {value && !error && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Set</span>
          )}
          {error && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Error</span>
          )}
        </span>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      {!collapsed && (
        <div className="p-3 bg-white">
          <textarea
            value={raw}
            onChange={(e) => handleChange(e.target.value)}
            rows={8}
            placeholder={placeholder || `Paste ${label} JSON here...`}
            className={`w-full px-3 py-2.5 font-mono text-xs border-2 rounded-lg focus:outline-none transition resize-y
              ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-500'}`}
          />
          {error && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {error} — fix JSON before saving
            </p>
          )}
          {!error && raw.trim() && (
            <p className="text-xs text-green-600 mt-1">✓ Valid JSON</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Leave empty to omit this schema from the blog.</p>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TABS = [
  { id: 'list', label: 'All Blogs', icon: List },
  { id: 'create', label: 'Create Blog', icon: Plus },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
];

const BlogManagement = () => {
  const [activeTab, setActiveTab] = useState('list');

  // ─── Shared state ─────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [siteFilter, setSiteFilter] = useState('');

const loadCategories = useCallback(async (site) => {
    setCategoriesLoading(true);
    try {
      const result = await apiFetchCategories(site);
      const raw = Array.isArray(result.data) ? result.data : [];
      const seen = new Map();
      raw.forEach(c => seen.set(c._id || c.id || c.name, c));
      setCategories(Array.from(seen.values()));
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(siteFilter); }, [siteFilter, loadCategories]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Page Header ── */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1 tracking-tight">Blog Management</h1>
              <p className="text-indigo-100 text-sm">Create, manage and publish blogs across multiple websites</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
                <Monitor size={14} /> Main Site
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
                <Globe size={14} /> New Site
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200
                  ${active
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Site Filter (shared)  */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3 flex items-center gap-4">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">Filter by site:</span>
          <div className="flex gap-2">
            {[
              { val: '', label: 'All Sites' },
              { val: 'main', label: 'Main Website' },
              { val: 'new_site', label: 'New Website' },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setSiteFilter(f.val)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${siteFilter === f.val
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'list' && (
          <BlogListTab siteFilter={siteFilter} categories={categories} />
        )}
        {activeTab === 'create' && (
          <BlogCreateTab
            categories={categories}
            categoriesLoading={categoriesLoading}
            onCategoryCreated={() => loadCategories(siteFilter)}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            loading={categoriesLoading}
            onRefresh={() => loadCategories(siteFilter)}
            siteFilter={siteFilter}
          />
        )}
      </div>
    </div>
  );
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 1: BLOG LIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BlogListTab({ siteFilter, categories }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModal, setEditModal] = useState(null); // { blog } or null
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

 const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allBlogs = await fetchAllBlogs(siteFilter);
      const raw = Array.isArray(allBlogs) ? allBlogs : [];
      const seen = new Map();
      raw.forEach(b => seen.set(b._id || b.id, b));
      setBlogs(Array.from(seen.values()));
    } catch (err) {
      setError(err.message);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, [siteFilter]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (blog) => {
    setEditModal({
      id: blog._id || blog.id,
      title: blog.title || '',
       content: blog.content || '',
      slug: blog.slug || '',
      category: (typeof blog.category === 'object' ? blog.category.name : blog.category) || '',
      imageUrl: blog.imageUrl || '',
      imageAlt: blog.imageAlt || '',
      seoTitle: blog.seoTitle || '',
      metaDescription: blog.metaDescription || '',
      keyphrase: blog.keyphrase || '',
      publishTo: blog.publishTo || ['main'],
      blogPostSchema: blog.blogPostSchema || null,
      faqSchema: blog.faqSchema || null,
      breadcrumbSchema: blog.breadcrumbSchema || null,
    });
    setSaveMsg(null);
  };

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const { id, ...payload } = editModal;
      await patchBlog(id, payload);
      setSaveMsg({ success: true, text: 'Blog updated successfully!' });
      load();
      setTimeout(() => setEditModal(null), 1200);
    } catch (err) {
      setSaveMsg({ success: false, text: 'Failed to update: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const filteredBlogs = blogs.filter(b =>
    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-gray-500 text-sm">Loading blogs…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
        <p className="text-red-600 font-medium mb-3">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blogs by title or category…"
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{filteredBlogs.length} blog{filteredBlogs.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Blog Rows */}
        {filteredBlogs.length === 0 ? (
          <div className="p-16 text-center">
            <FileText size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No blogs found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or site filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredBlogs.map(blog => {
              const blogId = blog._id || blog.id;
              const publishTo = blog.publishTo || ['main'];
              return (
                <div key={blogId} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    {blog.imageUrl ? (
                      <img
                        src={blog.imageUrl}
                        alt={blog.imageAlt || blog.title}
                        className="w-20 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-20 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={20} className="text-gray-300" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">{blog.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        {blog.category && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {typeof blog.category === 'object' ? blog.category.name : blog.category}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : '—'}
                        </span>
                        {/* SEO Schema indicators */}
                        <div className="flex gap-1">
                          {blog.blogPostSchema && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">BlogPost</span>}
                          {blog.faqSchema && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">FAQ</span>}
                          {blog.breadcrumbSchema && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">Breadcrumb</span>}
                        </div>
                      </div>
                      <div className="mt-2">
                        <SiteBadge sites={publishTo} />
                      </div>
                    </div>

                    {/* Edit Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => openEdit(blog)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
                      >
                        <Edit3 size={12} />
                        Edit Blog
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Full Edit Modal ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 px-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Blog</h2>
                <p className="text-indigo-100 text-xs mt-0.5 truncate max-w-xs">{editModal.title || 'Untitled'}</p>
              </div>
              <button
                onClick={() => setEditModal(null)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Save message */}
              {saveMsg && (
                <div className={`p-3 rounded-lg border-2 text-sm font-medium
                  ${saveMsg.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {saveMsg.text}
                </div>
              )}

              {/* Publish To */}
              <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border-2 border-indigo-200">
                <PublishToSelector
                  value={editModal.publishTo}
                  onChange={(val) => setEditModal(p => ({ ...p, publishTo: val }))}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editModal.title}
                  onChange={(e) => setEditModal(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
                  placeholder="Blog title"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug (URL)</label>
                <input
                  type="text"
                  value={editModal.slug}
                  onChange={(e) => setEditModal(p => ({ ...p, slug: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm bg-gray-50 font-mono"
                  placeholder="your-blog-slug"
                />
              </div>

              {/* Category + Thumbnail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                  <select
                    value={editModal.category}
                    onChange={(e) => setEditModal(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id || cat._id || cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thumbnail URL</label>
                  <input
                    type="text"
                    value={editModal.imageUrl}
                    onChange={(e) => setEditModal(p => ({ ...p, imageUrl: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Thumbnail Preview */}
              {editModal.imageUrl && (
                <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                  <img src={editModal.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                </div>
              )}
              <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Content
  </label>

  <textarea
    rows={12}
    value={editModal.content}
    onChange={(e) =>
      setEditModal(prev => ({
        ...prev,
        content: e.target.value,
      }))
    }
    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-y"
  />
</div>

              {/* ── SEO Section ── */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-indigo-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  SEO Settings
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">SEO Title</label>
                  <input
                    type="text"
                    value={editModal.seoTitle}
                    onChange={(e) => setEditModal(p => ({ ...p, seoTitle: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
                    placeholder="SEO optimized title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Description
                    <span className="text-gray-400 font-normal ml-1">({(editModal.metaDescription || '').length}/160)</span>
                  </label>
                  <textarea
                    value={editModal.metaDescription}
                    onChange={(e) => setEditModal(p => ({ ...p, metaDescription: e.target.value }))}
                    rows={2}
                    maxLength={160}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm resize-none"
                    placeholder="Brief description for search engines (max 160 chars)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Focus Keyphrase</label>
                    <input
                      type="text"
                      value={editModal.keyphrase}
                      onChange={(e) => setEditModal(p => ({ ...p, keyphrase: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
                      placeholder="e.g., Pet Wellness in India"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image Alt Text</label>
                    <input
                      type="text"
                      value={editModal.imageAlt}
                      onChange={(e) => setEditModal(p => ({ ...p, imageAlt: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
                      placeholder="Descriptive alt text"
                    />
                  </div>
                </div>
              </div>

              {/* ── SEO Schema Fields ── */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Code2 size={14} className="text-purple-500" />
                  SEO Schema Markup (JSON-LD)
                </h3>
                <SchemaJsonEditor
                  label="BlogPosting Schema"
                  value={editModal.blogPostSchema}
                  onChange={(val) => setEditModal(p => ({ ...p, blogPostSchema: val }))}
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "BlogPosting",\n  "headline": "...",\n  "author": { "@type": "Person", "name": "..." }\n}'}
                />
                <SchemaJsonEditor
                  label="FAQ Schema"
                  value={editModal.faqSchema}
                  onChange={(val) => setEditModal(p => ({ ...p, faqSchema: val }))}
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": []\n}'}
                />
                <SchemaJsonEditor
                  label="Breadcrumb Schema"
                  value={editModal.breadcrumbSchema}
                  onChange={(val) => setEditModal(p => ({ ...p, breadcrumbSchema: val }))}
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "BreadcrumbList",\n  "itemListElement": []\n}'}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setEditModal(null)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition text-sm font-semibold disabled:opacity-50 shadow-md shadow-indigo-200"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 2: CREATE BLOG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BlogCreateTab({ categories, categoriesLoading, onCategoryCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    category: '',
    thumbnail: '',
    seoTitle: '',
    metaDescription: '',
    keyphrase: '',
    imageAlt: '',
    publishTo: ['main'],
    blogPostSchema: null,
    faqSchema: null,
    breadcrumbSchema: null,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add category form
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', image: '', description: '', site: 'both' });
  const [addingCategory, setAddingCategory] = useState(false);

  const [quillLoaded, setQuillLoaded] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // Load Quill editor
  useEffect(() => {
    const loadQuill = async () => {
      if (window.Quill) {
        setQuillLoaded(true);
        return;
      }

  
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdn.quilljs.com/1.3.6/quill.js';
      script.onload = () => setQuillLoaded(true);
      document.body.appendChild(script);
    };

    loadQuill();
  }, []);

  // Init Quill
  useEffect(() => {
    if (quillLoaded && editorRef.current && !quillRef.current) {
      const Quill = window.Quill;
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Start writing your blog content...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'image'],
            [{ 'align': [] }],
            [{ 'color': [] }, { 'background': [] }],
            ['blockquote', 'code-block'],
            ['clean']
          ]
        }
      });

      quillRef.current.on('text-change', () => {
        const html = quillRef.current.root.innerHTML;
        setFormData(prev => ({ ...prev, content: html }));
      });
    }
  }, [quillLoaded]);

  // Auto slug from title
  useEffect(() => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}-]+/gu, '')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '');

      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]);

  // Auto SEO title
  useEffect(() => {
    if (formData.title && !formData.seoTitle) {
      setFormData(prev => ({ ...prev, seoTitle: formData.title }));
    }
  }, [formData.title]);

  // Add new category via API
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    setAddingCategory(true);
    try {
      await createCategory({
        name: newCategory.name.trim(),
        image: newCategory.image.trim() || '',
        description: newCategory.description.trim() || '',
        site: newCategory.site,
      });

      onCategoryCreated();
      setFormData(prev => ({ ...prev, category: newCategory.name.trim() }));
      setNewCategory({ name: '', image: '', description: '', site: 'both' });
      setShowAddCategory(false);
      setResponse({ success: true, message: `Category "${newCategory.name.trim()}" created successfully!` });
    } catch (error) {
      setResponse({ success: false, message: 'Failed to create category: ' + error.message });
    } finally {
      setAddingCategory(false);
    }
  };

  // Submit blog post
  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.category) {
      setResponse({
        success: false,
        message: 'Please fill in all required fields (Title, Content, Category)'
      });
      return;
    }

    if (formData.metaDescription && formData.metaDescription.length > 160) {
      setResponse({
        success: false,
        message: 'Meta description must be 160 characters or less'
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        slug: formData.slug,
        category: formData.category,
        imageUrl: formData.thumbnail,
        seoTitle: formData.seoTitle || formData.title,
        metaDescription: formData.metaDescription,
        keyphrase: formData.keyphrase,
        imageAlt: formData.imageAlt,
        publishTo: formData.publishTo,
        blogPostSchema: formData.blogPostSchema || null,
        faqSchema: formData.faqSchema || null,
        breadcrumbSchema: formData.breadcrumbSchema || null,
      };

      const data = await createBlog(payload);
      setResponse({ success: true, message: data.message || 'Blog published successfully!' });

      // Reset form
      setFormData({
        title: '',
        content: '',
        slug: '',
        category: '',
        thumbnail: '',
        seoTitle: '',
        metaDescription: '',
        keyphrase: '',
        imageAlt: '',
        publishTo: ['main'],
        blogPostSchema: null,
        faqSchema: null,
        breadcrumbSchema: null,
      });

      if (quillRef.current) {
        quillRef.current.setContents([]);
      }
    } catch (error) {
      setResponse({
        success: false,
        message: 'Failed to create blog post. ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8">

        {/* ── Publish To ── */}
        <div className="mb-8 p-5 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border-2 border-indigo-200">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} className="text-indigo-600" />
            <h3 className="text-base font-bold text-gray-800">Publishing Destination</h3>
          </div>
          <PublishToSelector
            value={formData.publishTo}
            onChange={(val) => setFormData(prev => ({ ...prev, publishTo: val }))}
          />
        </div>

        {/* ── Title ── */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-lg"
            placeholder="Enter your blog title..."
          />
        </div>

        {/* ── Slug ── */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Slug (URL)
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition bg-gray-50"
            placeholder="auto-generated-slug"
          />
          <p className="text-xs text-gray-500 mt-1">Auto-generated from title, but you can edit it</p>
        </div>

        {/* ── Category + Thumbnail ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {categoriesLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  Loading categories...
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id || cat._id || cat.name} value={cat.name}>
                      {cat.name} {cat.site && cat.site !== 'both' ? `(${cat.site === 'main' ? 'Main' : 'New Site'})` : ''}
                    </option>
                  ))}
                </select>
              )}
              
              {!showAddCategory ? (
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  <Plus size={16} />
                  Add New Category
                </button>
              ) : (
                <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200 space-y-3">
                  <h4 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                    <Tag size={16} />
                    Create New Category
                  </h4>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Category name *"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={newCategory.image}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Category image URL (e.g. Cloudinary link)"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                  {newCategory.image && (
                    <div className="w-full h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={newCategory.image}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Category description (optional)"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm"
                  />

                  {/* ✨ NEW: Site selector for category */}
                  <CategorySiteSelector
                    value={newCategory.site}
                    onChange={(val) => setNewCategory(prev => ({ ...prev, site: val }))}
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={addingCategory || !newCategory.name.trim()}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingCategory && <Loader2 size={14} className="animate-spin" />}
                      {addingCategory ? 'Creating...' : 'Create Category'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategory({ name: '', image: '', description: '', site: 'both' });
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Category Tags */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {categories.map(cat => (
                    <span
                      key={cat.id || cat._id || cat.name}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer transition
                        ${formData.category === cat.name 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                    >
                      {cat.image && (
                        <img src={cat.image} alt="" className="w-4 h-4 rounded-full object-cover" />
                      )}
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Thumbnail URL
            </label>
            <input
              type="text"
              value={formData.thumbnail}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition"
              placeholder="https://example.com/image.jpg"
            />
            {formData.thumbnail && (
              <div className="mt-3">
                <img
                  src={formData.thumbnail}
                  alt="Thumbnail preview"
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── SEO Section ── */}
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-indigo-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            SEO Settings
          </h3>
          
          <div className="space-y-4">
            {/* SEO Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                placeholder="SEO optimized title (defaults to main title)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use main title. Recommended: 50-60 characters
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition resize-none"
                rows="3"
                maxLength="160"
                placeholder="Brief description for search engines (max 160 characters)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>

            {/* Keyphrase */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Focus Keyphrase
              </label>
              <input
                type="text"
                value={formData.keyphrase}
                onChange={(e) => setFormData(prev => ({ ...prev, keyphrase: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                placeholder="e.g., Pet Wellness Hospitals in India"
              />
              <p className="text-xs text-gray-500 mt-1">
                Main keyword/phrase you want to rank for
              </p>
            </div>

            {/* Image Alt Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image Alt Text
              </label>
              <input
                type="text"
                value={formData.imageAlt}
                onChange={(e) => setFormData(prev => ({ ...prev, imageAlt: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                placeholder="Descriptive alt text for the thumbnail image"
              />
              <p className="text-xs text-gray-500 mt-1">
                Describes the thumbnail image for accessibility and SEO
              </p>
            </div>
          </div>
        </div>

        {/* ── SEO Schema Markup ── */}
        <div className="mb-6 space-y-3">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Code2 size={18} className="text-purple-500" />
            SEO Schema Markup (JSON-LD)
            <span className="text-xs font-normal text-gray-400">Optional</span>
          </h3>
          <SchemaJsonEditor
            label="BlogPosting Schema"
            value={formData.blogPostSchema}
            onChange={(val) => setFormData(prev => ({ ...prev, blogPostSchema: val }))}
            placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "BlogPosting",\n  "headline": "...",\n  "author": { "@type": "Person", "name": "..." }\n}'}
          />
          <SchemaJsonEditor
            label="FAQ Schema"
            value={formData.faqSchema}
            onChange={(val) => setFormData(prev => ({ ...prev, faqSchema: val }))}
            placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": []\n}'}
          />
          <SchemaJsonEditor
            label="Breadcrumb Schema"
            value={formData.breadcrumbSchema}
            onChange={(val) => setFormData(prev => ({ ...prev, breadcrumbSchema: val }))}
            placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "BreadcrumbList",\n  "itemListElement": []\n}'}
          />
        </div>

        {/* ── Rich Text Editor (Quill) ── */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          
          {/* Quill Editor Container */}
          <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
            <div ref={editorRef} className="min-h-[400px]" />
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
          >
            <Eye size={20} />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
            {loading ? 'Publishing...' : 'Publish Blog'}
          </button>
        </div>

        {/* ── Publishing Summary ── */}
        {formData.publishTo.length > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <span>Publishing to:</span>
            <SiteBadge sites={formData.publishTo} size="md" />
          </div>
        )}

        {/* ── API Response ── */}
        {response && (
          <div className={`mt-6 p-4 rounded-lg border-2 ${response.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <p className={`font-semibold ${response.success ? 'text-green-800' : 'text-red-800'}`}>
              {response.message}
            </p>
            {response.success && response.data && (
              <p className="text-sm text-green-700 mt-2">
                Blog ID: {response.data.data?.id}
              </p>
            )}
          </div>
        )}

        {/* ── Preview ── */}
        {showPreview && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Preview</h3>
            
            {/* SEO Preview */}
            <div className="bg-white p-4 rounded-lg shadow mb-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Google Search Preview</h4>
              <div className="space-y-1">
                <div className="text-blue-600 text-xl hover:underline cursor-pointer">
                  {formData.seoTitle || formData.title || 'Untitled'}
                </div>
                <div className="text-green-700 text-sm">
                  yoursite.com/{formData.slug || 'blog-post'}
                </div>
                <div className="text-gray-600 text-sm">
                  {formData.metaDescription || 'No meta description provided'}
                </div>
              </div>
            </div>

            {/* Publishing Info */}
            <div className="bg-white p-4 rounded-lg shadow mb-4 border border-purple-200">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Publishing Destinations</h4>
              <SiteBadge sites={formData.publishTo} size="md" />
            </div>

            {/* Blog Preview */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{formData.title || 'Untitled'}</h1>
              <div className="flex gap-4 text-sm text-gray-600 mb-6">
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                  {formData.category || 'Uncategorized'}
                </span>
                <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              {formData.thumbnail && (
                <img
                  src={formData.thumbnail}
                  alt={formData.imageAlt || 'Blog thumbnail'}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}

              <div
                className="prose prose-lg max-w-none 
                  prose-ul:list-disc prose-ul:ml-6 
                  prose-ol:list-decimal prose-ol:ml-6 
                  prose-li:my-1"
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 3: CATEGORIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CategoriesTab({ categories, loading, onRefresh, siteFilter }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', image: '', description: '', site: 'both' });
  const [creating, setCreating] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editSite, setEditSite] = useState('both');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleCreate = async () => {
    if (!newCategory.name.trim()) return;
    setCreating(true);
    setMessage(null);
    try {
      await createCategory({
        name: newCategory.name.trim(),
        image: newCategory.image.trim() || '',
        description: newCategory.description.trim() || '',
        site: newCategory.site,
      });
      setNewCategory({ name: '', image: '', description: '', site: 'both' });
      setShowCreate(false);
      setMessage({ success: true, text: `Category "${newCategory.name.trim()}" created!` });
      onRefresh();
    } catch (err) {
      setMessage({ success: false, text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSite = async (catId) => {
    setSaving(true);
    setMessage(null);
    try {
      await updateCategory(catId, { site: editSite });
      setEditingCat(null);
      setMessage({ success: true, text: 'Category site updated!' });
      onRefresh();
    } catch (err) {
      setMessage({ success: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-gray-500 text-sm">Loading categories…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'} found</p>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            <Plus size={14} />
            New Category
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl border-2 text-sm font-medium
          ${message.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Create Category Panel */}
      {showCreate && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Tag size={18} className="text-indigo-600" />
            Create New Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(p => ({ ...p, name: e.target.value }))}
                placeholder="Category name"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
              <input
                type="text"
                value={newCategory.image}
                onChange={(e) => setNewCategory(p => ({ ...p, image: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={newCategory.description}
              onChange={(e) => setNewCategory(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition text-sm"
            />
          </div>

          {/* Site Selector */}
          <CategorySiteSelector
            value={newCategory.site}
            onChange={(val) => setNewCategory(p => ({ ...p, site: val }))}
          />

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={creating || !newCategory.name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-50"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              {creating ? 'Creating…' : 'Create Category'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewCategory({ name: '', image: '', description: '', site: 'both' }); }}
              className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Grid */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <FolderOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">No categories found</p>
          <p className="text-gray-400 text-sm mt-1">Create your first category above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => {
            const catId = cat._id || cat.id;
            const isEditing = editingCat === catId;
            const catSite = cat.site || 'both';
            return (
              <div key={catId || cat.name} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all
                ${isEditing ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-100 hover:shadow-md'}`}>
                {/* Category Image */}
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-32 object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <FolderOpen size={28} className="text-indigo-300" />
                  </div>
                )}

                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{cat.name}</h4>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{cat.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <SiteBadge sites={catSite} />
                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setEditingCat(catId);
                          setEditSite(catSite);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium"
                      >
                        <Edit3 size={11} />
                        Edit Site
                      </button>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdateSite(catId)}
                          disabled={saving}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCat(null)}
                          className="px-2 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Edit */}
                  {isEditing && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <CategorySiteSelector value={editSite} onChange={setEditSite} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default BlogManagement;
