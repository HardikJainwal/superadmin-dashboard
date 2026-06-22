'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, RefreshCw, X, Save, Shield, Search, ChevronDown, ChevronUp,
  Code2, AlertCircle, CheckCircle2, ShieldCheck, ShieldOff, Lock
} from 'lucide-react';
import { getAllPermissions, createPermission } from '@/lib/corporateService';

export default function CorporatePermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  // ── Toast ─────────────────────────────────────────────────────────────────────
  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPermissions();
      setPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('error', err.message);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  // ── Form ──────────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const autoGenerateCode = (name) =>
    name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, name, code: autoGenerateCode(name) }));
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' });
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
      await createPermission(formData);
      showToast('success', `Permission "${formData.name}" created!`);
      resetForm();
      fetchPermissions();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getCategory = (code) => {
    if (!code) return 'other';
    const prefix = code.split('_')[0];
    return prefix.toLowerCase();
  };

  const categories = ['all', ...new Set(permissions.map(p => getCategory(p.code)))];

  const categoryColors = {
    nova: 'bg-violet-100 text-violet-700',
    expert: 'bg-amber-100 text-amber-700',
    selfie: 'bg-pink-100 text-pink-700',
    community: 'bg-blue-100 text-blue-700',
    reflection: 'bg-teal-100 text-teal-700',
    event: 'bg-rose-100 text-rose-700',
    resource: 'bg-lime-100 text-lime-700',
    role: 'bg-indigo-100 text-indigo-700',
    other: 'bg-slate-100 text-slate-600'
  };

  const getCategoryColor = (code) => {
    const cat = getCategory(code);
    return categoryColors[cat] || categoryColors.other;
  };

  // ── Sort & Filter ─────────────────────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = permissions
    .filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
      const matchesCategory = filterCategory === 'all' || getCategory(p.code) === filterCategory;
      return matchesSearch && matchesCategory;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/40 p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-medium animate-slideIn ${
          toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-200">
                  <Shield size={22} className="text-white" />
                </div>
                Permission Management
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Create & view system permissions</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchPermissions} disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all disabled:opacity-50">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5">
                <Plus size={16} />
                Add Permission
              </button>
            </div>
          </div>
        </div>

        {/* Flow Guidance Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 backdrop-blur-sm rounded-2xl border border-blue-100/60 p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5">
              <Shield size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">⚙️ Initial Setup — Do this first</p>
              <p className="text-xs text-blue-600/80 mt-0.5">Permissions define <strong>what actions users can perform</strong>. Create them here first, then assign them to roles in the <strong>Role Permissions</strong> page.</p>
            </div>
          </div>
        </div>

        {/* ─── Search + Category Filter ────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-4 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permissions..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm transition-all" />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Stats ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Permissions</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{permissions.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Categories</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{new Set(permissions.map(p => getCategory(p.code))).size}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
            <p className="text-xs font-semibold text-cyan-500 uppercase tracking-wider">Filtered</p>
            <p className="text-3xl font-bold text-cyan-600 mt-1">{filtered.length}</p>
          </div>
        </div>

        {/* ─── Table ───────────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-500 mt-4 text-sm">Loading permissions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Lock size={48} className="mb-3 opacity-30" />
              <p className="text-lg font-medium">No permissions found</p>
              <p className="text-sm mt-1">{searchQuery || filterCategory !== 'all' ? 'Adjust your filters' : 'Create your first permission'}</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('name')}>
                  Name <SortIcon field="name" />
                </div>
                <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('code')}>
                  Code <SortIcon field="code" />
                </div>
                <div className="col-span-1 text-center">Category</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-center">Info</div>
              </div>

              {filtered.map((perm) => (
                <div key={perm._id || perm.code} className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/40 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center">
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className="text-blue-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">{perm.name}</span>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-medium">
                        <Code2 size={12} />
                        {perm.code}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getCategoryColor(perm.code)}`}>
                        {getCategory(perm.code)}
                      </span>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm text-slate-600 line-clamp-1">{perm.description || '—'}</p>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => setExpandedId(expandedId === perm._id ? null : perm._id)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        {expandedId === perm._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {expandedId === perm._id && (
                    <div className="px-6 pb-4 pt-0">
                      <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase">ID</span>
                          <p className="text-slate-700 font-mono text-xs mt-0.5">{perm._id}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase">Code</span>
                          <p className="text-slate-700 font-mono mt-0.5">{perm.code}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase">Created</span>
                          <p className="text-slate-700 mt-0.5">{perm.createdAt ? new Date(perm.createdAt).toLocaleString() : '—'}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase">Updated</span>
                          <p className="text-slate-700 mt-0.5">{perm.updatedAt ? new Date(perm.updatedAt).toLocaleString() : '—'}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Description</span>
                          <p className="text-slate-700 mt-0.5">{perm.description || 'No description'}</p>
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

      {/* ─── Create Permission Modal ────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
             onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                  <Shield size={18} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">New Permission</h2>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Permission Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleNameChange}
                  placeholder="e.g. Manage Roles"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm transition-all"
                  required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Permission Code *</label>
                <div className="relative">
                  <Code2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" name="code" value={formData.code} onChange={handleInputChange}
                    placeholder="e.g. ROLE_MANAGE"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm font-mono transition-all"
                    required />
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto-generated from name. Edit if needed.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3}
                  placeholder="What does this permission allow?"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm transition-all resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save size={16} />
                  {creating ? 'Creating...' : 'Create Permission'}
                </button>
                <button type="button" onClick={resetForm}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 transition-all">
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
