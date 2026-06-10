'use client'
import React, { useState, useCallback } from 'react';
import { 
  Upload, FileText, Link, AlertCircle, Youtube, 
  Headphones, BookOpen, File, X, Plus, Tag,
  Image, Clock, Building2, CheckCircle2, Loader2
} from 'lucide-react';

const RESOURCE_TYPES = [
  { 
    value: 'youtube', 
    label: 'YouTube Video', 
    icon: Youtube, 
    urlField: 'videoUrl', 
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    ringColor: 'focus:ring-red-500',
    placeholder: 'https://www.youtube.com/watch?v=abc123',
    hint: 'Supports youtube.com/watch and youtu.be formats'
  },
  { 
    value: 'pdf', 
    label: 'PDF Document', 
    icon: File, 
    urlField: 'pdfUrl', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    ringColor: 'focus:ring-orange-500',
    placeholder: 'https://example.com/document.pdf',
    hint: 'Direct link to PDF or Google Drive shared link'
  },
  { 
    value: 'article', 
    label: 'Article', 
    icon: BookOpen, 
    urlField: 'articleUrl', 
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    ringColor: 'focus:ring-emerald-500',
    placeholder: 'https://blog.com/article-title',
    hint: 'Link to any online article or blog post'
  },
  { 
    value: 'audio', 
    label: 'Audio', 
    icon: Headphones, 
    urlField: 'audioUrl', 
    color: 'text-violet-500',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    ringColor: 'focus:ring-violet-500',
    placeholder: 'https://audio.com/episode.mp3',
    hint: 'Link to podcast episode or audio file'
  },
];

const API_BASE = process.env.NEXT_PUBLIC_R_BACKEND_URL || 'https://schoolapi.devdoot.org/v1/api';

const AddResource = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'youtube',
    imageUrl: '',
    videoUrl: '',
    pdfUrl: '',
    articleUrl: '',
    audioUrl: '',
    tags: [],
    time: '',
    schoolId: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currentType = RESOURCE_TYPES.find(t => t.value === formData.type);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (typeValue) => {
    setFormData(prev => ({ ...prev, type: typeValue }));
  };

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'youtube',
      imageUrl: '',
      videoUrl: '',
      pdfUrl: '',
      articleUrl: '',
      audioUrl: '',
      tags: [],
      time: '',
      schoolId: '',
    });
    setTagInput('');
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Resource title is required.' });
      return false;
    }
    const urlField = currentType.urlField;
    if (!formData[urlField] || !formData[urlField].trim()) {
      setMessage({ type: 'error', text: `${currentType.label} URL is required.` });
      return false;
    }
    // YouTube URL validation
    if (formData.type === 'youtube') {
      const ytUrl = formData.videoUrl.trim();
      const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
      if (!ytRegex.test(ytUrl)) {
        setMessage({ type: 'error', text: 'Please enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...).' });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication token not found. Please log in again.' });
        setLoading(false);
        return;
      }

      const urlField = currentType.urlField;

      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        [urlField]: formData[urlField].trim(),
      };

      // Optional fields
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.imageUrl.trim()) payload.imageUrl = formData.imageUrl.trim();
      if (formData.tags.length > 0) payload.tags = formData.tags;
      if (formData.time.trim()) payload.time = formData.time.trim();
      if (formData.schoolId.trim()) payload.schoolId = formData.schoolId.trim();

      const response = await fetch(`${API_BASE}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `Resource "${data.data?.title || formData.title}" created successfully!` });
        resetForm();
        // Keep the success message visible
        setMessage(prev => ({ ...prev }));
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to add resource. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Resource</h1>
              <p className="text-sm text-gray-500 mt-0.5">Create educational resources for schools</p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success'
              ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200'
              : 'bg-red-50/80 text-red-800 border-red-200'
          }`}>
            {message.type === 'success' 
              ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
              : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            }
            <span className="text-sm font-medium">{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto text-current opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resource Type Selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Resource Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RESOURCE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                      isSelected
                        ? `${type.borderColor} ${type.bgColor} shadow-sm`
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 transition-colors ${isSelected ? type.color : 'text-gray-400 group-hover:text-gray-500'}`} />
                    <span className={`text-xs font-medium transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      {type.label}
                    </span>
                    {isSelected && (
                      <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm ${
                        type.value === 'youtube' ? 'bg-red-500' :
                        type.value === 'pdf' ? 'bg-orange-500' :
                        type.value === 'article' ? 'bg-emerald-500' :
                        'bg-violet-500'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Resource Details
            </h2>

            {/* Title */}
            <div>
              <label htmlFor="resource-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="resource-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., JavaScript Closures Explained"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="resource-description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                id="resource-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Brief description of the resource content..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white resize-none outline-none"
              />
            </div>

            {/* Resource URL (Dynamic based on type) */}
            <div>
              <label htmlFor="resource-url" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <span>{currentType.label} URL</span>
                <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 ${currentType.color}`}>
                  {React.createElement(currentType.icon, { className: 'w-4 h-4' })}
                </div>
                <input
                  id="resource-url"
                  type="url"
                  name={currentType.urlField}
                  value={formData[currentType.urlField]}
                  onChange={handleChange}
                  placeholder={currentType.placeholder}
                  className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white outline-none`}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                <Link className="w-3 h-3" />
                {currentType.hint}
              </p>
            </div>
          </div>

          {/* Media & Metadata */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Image className="w-4 h-4 text-gray-400" />
              Media & Metadata
            </h2>

            {/* Image URL */}
            <div>
              <label htmlFor="resource-image" className="block text-sm font-medium text-gray-700 mb-1.5">
                Thumbnail / Image URL
              </label>
              <div className="relative">
                <Image className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="resource-image"
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Duration/Time */}
              <div>
                <label htmlFor="resource-time" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Duration / Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="resource-time"
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    placeholder="e.g., 15 min, 30 pages"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* School ID */}
              <div>
                <label htmlFor="resource-school" className="block text-sm font-medium text-gray-700 mb-1.5">
                  School ID
                  <span className="text-xs text-gray-400 font-normal ml-1.5">(Optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="resource-school"
                    type="text"
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleChange}
                    placeholder="Leave empty for global"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="resource-tags" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all min-h-[42px]">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-500 hover:text-blue-800 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  id="resource-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={formData.tags.length === 0 ? "Type a tag and press Enter..." : "Add more..."}
                  className="flex-1 min-w-[120px] bg-transparent text-sm outline-none border-none p-0.5"
                />
                {tagInput.trim() && (
                  <button
                    type="button"
                    onClick={addTag}
                    className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Press Enter or click + to add tags. Backspace to remove last tag.</p>
            </div>
          </div>

          {/* Preview Card */}
          {formData.title && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Preview</h2>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="thumbnail"
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-200"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center ${currentType.bgColor}`}>
                    {React.createElement(currentType.icon, { className: `w-8 h-8 ${currentType.color}` })}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{formData.title}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${currentType.bgColor} ${currentType.color}`}>
                      {formData.type}
                    </span>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{formData.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    {formData.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formData.time}
                      </span>
                    )}
                    {formData.schoolId ? (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {formData.schoolId}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-medium">Global</span>
                    )}
                    {formData.tags.length > 0 && formData.tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded text-[10px]">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Resource...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Create Resource
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-xl font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-[0.98]"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Tips & Guidelines
          </h3>
          <ul className="text-sm text-blue-800/80 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong>YouTube:</strong> Use full URL (youtube.com/watch?v=...) or short URL (youtu.be/...)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong>PDF:</strong> Ensure the file is publicly accessible (Google Drive: &quot;Anyone with the link&quot;)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong>School ID:</strong> Leave empty to make the resource available globally to all schools</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong>Tags:</strong> Add relevant tags to help users discover resources easily</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddResource;