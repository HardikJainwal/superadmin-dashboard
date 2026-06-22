'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, RefreshCw, X, Save, Zap, ToggleLeft, ToggleRight,
  Search, ChevronDown, ChevronUp, Code2, FileText, AlertCircle, CheckCircle2
} from 'lucide-react';
import { getAllFeatures, createFeature } from '@/lib/corporateService';

export default function CorporateFeaturesPage() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true
  });

  // ── Toast helper ──────────────────────────────────────────────────────────────
  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Fetch features ────────────────────────────────────────────────────────────
  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllFeatures();
      setFeatures(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('error', err.message);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchFeatures(); }, [fetchFeatures]); 
  // ── Form handlers ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const autoGenerateCode = (name) => {
    return name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      code: autoGenerateCode(name)
    }));
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', isActive: true });
    setIsFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('error', 'Name and Code are required.');
      return;
    }
    setCreating(true);
    try {
      await createFeature(formData);
      showToast('success', `Feature "${formData.name}" created successfully!`);
      resetForm();
      fetchFeatures();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Sort & filter ─────────────────────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = features
    .filter(f => {
      const q = searchQuery.toLowerCase();
      return (
        f.name?.toLowerCase().includes(q) ||
        f.code?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aVal = (a[sortField] || '').toString().toLowerCase();
      const bVal = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={14} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40 p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-medium transition-all animate-slideIn ${
          toast.type === 'success'
            ? 'bg-emerald-500/90 text-white'
            : 'bg-red-500/90 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── Header ──────────────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-200">
                  <Zap size={22} className="text-white" />
                </div>
                Feature Management
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Manage corporate platform features</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchFeatures}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5"
              >
                <Plus size={16} />
                Add Feature
              </button>
            </div>
          </div>
        </div>

        {/* Flow Guidance Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 backdrop-blur-sm rounded-2xl border border-purple-100/60 p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0 mt-0.5">
              <Zap size={14} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-800">⚙️ Initial Setup — Do this first</p>
              <p className="text-xs text-purple-600/80 mt-0.5">Features are <strong>platform-wide capabilities</strong>. Create them here first, then enable them for specific organizations in the <strong>Org Features</strong> page.</p>
            </div>
          </div>
        </div>

        {/* ─── Search bar ──────────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features by name, code, or description..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* ─── Stats cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Features</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{features.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Active</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{features.filter(f => f.isActive).length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Inactive</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{features.filter(f => !f.isActive).length}</p>
          </div>
        </div>

        {/* ─── Features Table ──────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-slate-500 mt-4 text-sm">Loading features...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Zap size={48} className="mb-3 opacity-30" />
              <p className="text-lg font-medium">No features found</p>
              <p className="text-sm mt-1">{searchQuery ? 'Try a different search' : 'Create your first feature'}</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('name')}>
                  Name <SortIcon field="name" />
                </div>
                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('code')}>
                  Code <SortIcon field="code" />
                </div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-center">Details</div>
              </div>

              {/* Table Rows */}
              {filtered.map((feature) => (
                <div key={feature._id || feature.code} className="border-b border-slate-100 last:border-b-0 hover:bg-purple-50/40 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center">
                    {/* Name */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${feature.isActive ? 'bg-emerald-400 shadow-sm shadow-emerald-200' : 'bg-slate-300'}`} />
                        <span className="font-semibold text-slate-800">{feature.name}</span>
                      </div>
                    </div>

                    {/* Code */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-mono font-medium">
                        <Code2 size={12} />
                        {feature.code}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="col-span-4">
                      <p className="text-sm text-slate-600 line-clamp-1">{feature.description || '—'}</p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex justify-center">
                      {feature.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                          <ToggleRight size={14} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold">
                          <ToggleLeft size={14} />
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Expand */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => setExpandedId(expandedId === feature._id ? null : feature._id)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                      >
                        {expandedId === feature._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === feature._id && (
                    <div className="px-6 pb-4 pt-0">
                      <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase">ID</span>
                          <p className="text-slate-700 font-mono text-xs mt-0.5">{feature._id}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase">Code</span>
                          <p className="text-slate-700 font-mono mt-0.5">{feature.code}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase">Created</span>
                          <p className="text-slate-700 mt-0.5">{feature.createdAt ? new Date(feature.createdAt).toLocaleString() : '—'}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase">Updated</span>
                          <p className="text-slate-700 mt-0.5">{feature.updatedAt ? new Date(feature.updatedAt).toLocaleString() : '—'}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Description</span>
                          <p className="text-slate-700 mt-0.5">{feature.description || 'No description provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ─── Create Feature Modal ──────────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
             onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <Zap size={18} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">New Feature</h2>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Feature Name *</label>
                <input
                  type="text" name="name" value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Nova Score"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Feature Code *</label>
                <div className="relative">
                  <Code2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" name="code" value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g. NOVA_SCORE"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm font-mono transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto-generated from name. Edit if needed.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  name="description" value={formData.description}
                  onChange={handleInputChange} rows={3}
                  placeholder="Brief description of this feature..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Active Status</label>
                  <p className="text-xs text-slate-400 mt-0.5">Enable this feature on creation</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative w-12 h-7 rounded-full transition-colors ${formData.isActive ? 'bg-purple-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {creating ? 'Creating...' : 'Create Feature'}
                </button>
                <button
                  type="button" onClick={resetForm}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
