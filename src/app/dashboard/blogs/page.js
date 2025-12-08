'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Eye, Send, Plus, X } from 'lucide-react';

const BlogPostEditor = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    category: '',
    thumbnail: ''
  });

  const [showPreview, setShowPreview] = useState(false);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(['HealthBuddy', 'ImmuniCare', 'CareMatch', 'MedEquip', 'Medical', 'PetWell']);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [quillLoaded, setQuillLoaded] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

 
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

      // Update content on change
      quillRef.current.on('text-change', () => {
        const html = quillRef.current.root.innerHTML;
        setFormData(prev => ({ ...prev, content: html }));
      });
    }
  }, [quillLoaded]);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]);

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setCategories(categories.filter(cat => cat !== categoryToRemove));
    if (formData.category === categoryToRemove) {
      setFormData(prev => ({ ...prev, category: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.category) {
      setResponse({
        success: false,
        message: 'Please fill in all required fields (Title, Content, Category)'
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const payload = {
        ...formData,
        imageUrl: formData.thumbnail,
        date: new Date().toISOString()
      };

      const res = await fetch('http://localhost:3000/v1/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setResponse(data);

      if (data.success) {
        // Reset form
        setFormData({
          title: '',
          content: '',
          slug: '',
          category: '',
          thumbnail: ''
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
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  
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
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        placeholder="New category name"
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategory(false);
                          setNewCategory('');
                        }}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Category Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {categories.map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          className="hover:bg-indigo-200 rounded-full p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
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
                  placeholder="/images/blog.png"
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
                      alt="Blog thumbnail"
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