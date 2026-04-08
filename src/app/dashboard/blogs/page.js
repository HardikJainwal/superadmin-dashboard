'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, Send, Plus, X, Loader2, ImageIcon, Tag } from 'lucide-react';

const BLOG_API_BASE = 'https://api.devdoot.org/v1/api/blogs';

const BlogPostEditor = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    category: '',
    thumbnail: '',
    seoTitle: '',
    metaDescription: '',
    keyphrase: '',
    imageAlt: ''
  });

  const [showPreview, setShowPreview] = useState(false);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Categories from API
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  // Add category form
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', image: '', description: '' });
  const [addingCategory, setAddingCategory] = useState(false);

  const [quillLoaded, setQuillLoaded] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await fetch(`${BLOG_API_BASE}/categories`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoriesError(error.message);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
      const res = await fetch(`${BLOG_API_BASE}/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          image: newCategory.image.trim() || '',
          description: newCategory.description.trim() || ''
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Refetch categories from API to get the updated list
        await fetchCategories();
        setFormData(prev => ({ ...prev, category: newCategory.name.trim() }));
        setNewCategory({ name: '', image: '', description: '' });
        setShowAddCategory(false);
        setResponse({ success: true, message: `Category "${newCategory.name.trim()}" created successfully!` });
      } else {
        setResponse({ success: false, message: data.message || 'Failed to create category' });
      }
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
        imageAlt: formData.imageAlt
      };

      const res = await fetch(`${BLOG_API_BASE}/blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setResponse(data);

      if (data.success) {
        setFormData({
          title: '',
          content: '',
          slug: '',
          category: '',
          thumbnail: '',
          seoTitle: '',
          metaDescription: '',
          keyphrase: '',
          imageAlt: ''
        });

        if (quillRef.current) {
          quillRef.current.setContents([]);
        }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Create New Blog Post</h1>
            <p className="text-indigo-100">Share your thoughts with the world</p>
          </div>

          <div className="p-8">

            {/* Title */}
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

            {/* Slug */}
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

            {/* Category + Thumbnail */}
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
                  ) : categoriesError ? (
                    <div className="space-y-2">
                      <div className="px-4 py-3 border-2 border-red-200 rounded-lg text-red-600 text-sm">
                        Failed to load categories: {categoriesError}
                      </div>
                      <button
                        type="button"
                        onClick={fetchCategories}
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
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
                            setNewCategory({ name: '', image: '', description: '' });
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category Tags (from API) */}
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {categories.map(cat => (
                        <span
                          key={cat.id || cat.name}
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

            {/* SEO Section */}
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

            {/* Rich Text Editor */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              
              {/* Quill Editor Container */}
              <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                <div ref={editorRef} className="min-h-[400px]" />
              </div>
            </div>

            {/* Action Buttons */}
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

            {/* API Response */}
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

            {/* Preview */}
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
      </div>
    </div>
  );
};

export default BlogPostEditor;
