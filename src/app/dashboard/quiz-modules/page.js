'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, X, RefreshCw, Search, ChevronDown, ChevronUp, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { createQuizModule, getQuizModules, deleteQuizModule } from '@/lib/quizModuleApi';


const FA_ICONS = [
  'fa-globe', 'fa-heart', 'fa-star', 'fa-user', 'fa-home', 'fa-book',
  'fa-brain', 'fa-lightbulb', 'fa-trophy', 'fa-medal', 'fa-award',
  'fa-graduation-cap', 'fa-school', 'fa-chalkboard-user', 'fa-pen',
  'fa-pencil', 'fa-clipboard', 'fa-clipboard-check', 'fa-clipboard-list',
  'fa-list-check', 'fa-circle-check', 'fa-square-check', 'fa-check',
  'fa-bullseye', 'fa-chart-line', 'fa-chart-bar', 'fa-chart-pie',
  'fa-fire', 'fa-bolt', 'fa-sun', 'fa-moon', 'fa-cloud', 'fa-snowflake',
  'fa-leaf', 'fa-seedling', 'fa-tree', 'fa-mountain', 'fa-water',
  'fa-dumbbell', 'fa-spa', 'fa-hand-holding-heart', 'fa-hands-praying',
  'fa-people-group', 'fa-person-running', 'fa-person-walking',
  'fa-heart-pulse', 'fa-stethoscope', 'fa-pills', 'fa-apple-whole',
  'fa-carrot', 'fa-utensils', 'fa-mug-hot', 'fa-wine-glass',
  'fa-bed', 'fa-clock', 'fa-calendar', 'fa-hourglass-half',
  'fa-bell', 'fa-envelope', 'fa-comment', 'fa-comments',
  'fa-thumbs-up', 'fa-handshake', 'fa-face-smile', 'fa-face-laugh',
  'fa-music', 'fa-palette', 'fa-camera', 'fa-film', 'fa-gamepad',
  'fa-puzzle-piece', 'fa-gear', 'fa-wrench', 'fa-shield-halved',
  'fa-lock', 'fa-key', 'fa-flag', 'fa-bookmark', 'fa-tag',
  'fa-code', 'fa-laptop', 'fa-mobile-screen', 'fa-wifi',
  'fa-rocket', 'fa-plane', 'fa-car', 'fa-bicycle', 'fa-ship',
  'fa-building', 'fa-landmark', 'fa-industry', 'fa-briefcase',
  'fa-suitcase', 'fa-money-bill', 'fa-coins', 'fa-gem',
  'fa-compass', 'fa-map', 'fa-location-dot', 'fa-magnifying-glass',
  'fa-eye', 'fa-ear-listen', 'fa-hand', 'fa-wand-magic-sparkles',
];

function IconPicker({ selectedIcon, onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return FA_ICONS;
    const q = search.toLowerCase().replace('fa-', '');
    return FA_ICONS.filter(icon => icon.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-icons text-xl"></i>
            Select an Icon
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons... (e.g. heart, star, brain)"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-gray-50"
              autoFocus
            />
          </div>
          {selectedIcon && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <span>Selected:</span>
              <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg font-medium">
                <i className={`fa-solid ${selectedIcon}`}></i>
                {selectedIcon}
              </span>
            </div>
          )}
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          {filteredIcons.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <i className="fa-solid fa-face-sad-tear text-4xl mb-3 block"></i>
              <p>No icons found for &quot;{search}&quot;</p>
            </div>
          ) : (
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
              {filteredIcons.map((icon) => {
                const isSelected = selectedIcon === icon;
                return (
                  <button
                    key={icon}
                    onClick={() => { onSelect(`fa-solid ${icon}`); onClose(); }}
                    title={icon.replace('fa-', '')}
                    className={`
                      aspect-square flex items-center justify-center rounded-xl text-lg transition-all duration-150
                      ${isSelected
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-110 ring-2 ring-purple-300'
                        : 'bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:shadow-md'
                      }
                    `}
                  >
                    <i className={`fa-solid ${icon}`}></i>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizModulesPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'fa-solid fa-globe',
    isActive: true,
    questions: [
      { text: '', order: 1 },
    ],
  });
  

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

useEffect(() => {
  const storedToken = localStorage.getItem('corporate_token');
  if (storedToken) {
    setToken(storedToken);
    fetchModules(storedToken);
  }
}, []);

  // Fetch modules
const fetchModules = async (customToken) => {
  const authToken = customToken || token;

  if (!authToken?.trim()) {
    showMsg('error', 'Authorization token not found.');
    return;
  }

  setFetching(true);
  try {
    const data = await getQuizModules(authToken);
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data.data && Array.isArray(data.data)) list = data.data;
      else if (data.modules && Array.isArray(data.modules)) list = data.modules;
      setModules(list);
    } catch (err) {
      showMsg('error', err.message);
      setModules([]);
    } finally {
      setFetching(false);
    }
  };

  // Create module
  const handleCreate = async () => {
    if (!token.trim()) {
      showMsg('error', 'Please enter an Authorization Bearer token first.');
      return;
    }
    if (!formData.name.trim()) {
      showMsg('error', 'Module name is required.');
      return;
    }
    const validQuestions = formData.questions.filter(q => q.text.trim());
    if (validQuestions.length === 0) {
      showMsg('error', 'Please add at least one question.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        isActive: formData.isActive,
        questions: validQuestions.map((q, i) => ({ text: q.text.trim(), order: i + 1 })),
      };
      await createQuizModule(token, payload);
      showMsg('success', 'Quiz module created successfully!');
      resetForm();
      fetchModules();
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete module
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this module?')) return;
    try {
      await deleteQuizModule(token, id);
      showMsg('success', 'Module deleted successfully!');
      setModules(prev => prev.filter(m => (m._id || m.id) !== id));
    } catch (err) {
      showMsg('error', err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'fa-solid fa-globe',
      isActive: true,
      questions: [{ text: '', order: 1 }],
    });
    setIsFormOpen(false);
  };

  // Question management
  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { text: '', order: prev.questions.length + 1 }],
    }));
  };

  const removeQuestion = (idx) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 })),
    }));
  };

  const updateQuestion = (idx, text) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === idx ? { ...q, text } : q)),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <i className="fa-solid fa-clipboard-list text-2xl"></i>
              Corporate Quiz Modules
            </h1>
            <p className="text-purple-100 mt-1">Create and manage quiz modules with custom icons and questions</p>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success'
              ? <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              : <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            }
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Modules {modules.length > 0 && <span className="text-gray-400 font-normal text-base">({modules.length})</span>}
          </h2>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
          >
            <Plus size={18} />
            Create Module
          </button>
        </div>

        {/* Create Module Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={resetForm}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Create Quiz Module</h2>
                <button onClick={resetForm} className="text-white/80 hover:text-white transition-colors">
                  <X size={22} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Module Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Stress Assessment"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    placeholder="Describe the purpose of this quiz module..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                  />
                </div>

                {/* Icon Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Icon *</label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    className="flex items-center gap-3 w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left group"
                  >
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg shadow-sm">
                      <i className={formData.icon}></i>
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-gray-700">{formData.icon}</span>
                      <span className="block text-xs text-gray-400">Click to change icon</span>
                    </span>
                    <ChevronDown size={16} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </button>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Active</span>
                    <p className="text-xs text-gray-400">Module will be visible to users when active</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                      formData.isActive ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                      formData.isActive ? 'left-6' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Questions ({formData.questions.length})
                    </label>
                    <button
                      onClick={addQuestion}
                      className="flex items-center gap-1.5 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
                    >
                      <Plus size={16} />
                      Add Question
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {formData.questions.map((q, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => updateQuestion(idx, e.target.value)}
                          placeholder={`Question ${idx + 1}...`}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                        {formData.questions.length > 1 && (
                          <button
                            onClick={() => removeQuestion(idx)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-100 px-6 py-4 flex gap-3 bg-gray-50/50">
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium text-sm shadow-md disabled:opacity-50"
                >
                  <Save size={16} />
                  {loading ? 'Creating...' : 'Create Module'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Icon Picker Modal */}
        {showIconPicker && (
          <IconPicker
            selectedIcon={formData.icon.replace('fa-solid ', '')}
            onSelect={(icon) => setFormData(prev => ({ ...prev, icon }))}
            onClose={() => setShowIconPicker(false)}
          />
        )}

        {/* Modules Grid */}
        {fetching ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400 font-medium">Loading modules...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <i className="fa-solid fa-clipboard-list text-5xl text-gray-200 mb-4 block"></i>
            <p className="text-gray-500 font-medium text-lg">No quiz modules yet</p>
            <p className="text-gray-400 text-sm mt-1">Click &quot;Create Module&quot; to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <div
                key={mod._id || mod.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xl shadow-sm">
                      <i className={mod.icon || 'fa-solid fa-globe'}></i>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        mod.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {mod.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleDelete(mod._id || mod.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{mod.name}</h3>
                  {mod.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{mod.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <i className="fa-solid fa-circle-question"></i>
                    <span>{mod.questions?.length || 0} questions</span>
                  </div>
                </div>
                {/* Question preview */}
                {mod.questions && mod.questions.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
                    <p className="text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Preview</p>
                    <div className="space-y-1">
                      {mod.questions.slice(0, 3).map((q, i) => (
                        <p key={i} className="text-xs text-gray-500 truncate">
                          <span className="text-purple-400 font-semibold mr-1">{q.order || i + 1}.</span>
                          {q.text}
                        </p>
                      ))}
                      {mod.questions.length > 3 && (
                        <p className="text-xs text-gray-400 italic">+{mod.questions.length - 3} more...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
