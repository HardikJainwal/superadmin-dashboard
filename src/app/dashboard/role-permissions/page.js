'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, RefreshCw, Shield, ShieldCheck, AlertCircle, CheckCircle2,
  UserCog, Search, Check, X, Building2, Loader2
} from 'lucide-react';
import { getAllPermissions, assignRolePermissions, getAllOrgs, getAllRoles } from '@/lib/corporateService';

export default function RolePermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roleId, setRoleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

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

  // ── Fetch orgs ──
  const fetchOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const data = await getAllOrgs();
      setOrgs(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('error', 'Failed to load organizations');
    } finally {
      setLoadingOrgs(false);
    }
  }, [showToast]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  // ── When org changes, fetch roles ──
  useEffect(() => {
    if (!selectedOrgId) { setRoles([]); setRoleId(''); return; }
    const loadRoles = async () => {
      setLoadingRoles(true);
      setRoleId('');
      try {
        const data = await getAllRoles(selectedOrgId);
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        showToast('error', 'Failed to load roles');
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };
    loadRoles();
  }, [selectedOrgId, showToast]);

  // ── Category helpers ──────────────────────────────────────────────────────────
  const getCategory = (code) => {
    if (!code) return 'other';
    return code.split('_')[0].toLowerCase();
  };

  const categories = ['all', ...new Set(permissions.map(p => getCategory(p.code)))];

  const categoryColors = {
    nova: 'from-violet-500 to-purple-600',
    expert: 'from-amber-500 to-orange-600',
    selfie: 'from-pink-500 to-rose-600',
    community: 'from-blue-500 to-indigo-600',
    reflection: 'from-teal-500 to-emerald-600',
    event: 'from-rose-500 to-red-600',
    resource: 'from-lime-500 to-green-600',
    role: 'from-indigo-500 to-blue-600',
    other: 'from-slate-400 to-slate-600'
  };

  const getCategoryGradient = (code) => {
    const cat = getCategory(code);
    return categoryColors[cat] || categoryColors.other;
  };

  // ── Toggle permission ─────────────────────────────────────────────────────────
  const togglePerm = (code) => {
    setSelectedPerms(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const toggleAll = () => {
    if (selectedPerms.length === filtered.length) {
      setSelectedPerms([]);
    } else {
      setSelectedPerms(filtered.map(p => p.code));
    }
  };

  const toggleCategory = (cat) => {
    const catPerms = permissions.filter(p => getCategory(p.code) === cat).map(p => p.code);
    const allSelected = catPerms.every(c => selectedPerms.includes(c));
    if (allSelected) {
      setSelectedPerms(prev => prev.filter(c => !catPerms.includes(c)));
    } else {
      setSelectedPerms(prev => [...new Set([...prev, ...catPerms])]);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!roleId.trim()) {
      showToast('error', 'Please enter a Role ID');
      return;
    }
    if (selectedPerms.length === 0) {
      showToast('error', 'Please select at least one permission');
      return;
    }
    setAssigning(true);
    try {
      await assignRolePermissions(roleId.trim(), selectedPerms);
      showToast('success', `${selectedPerms.length} permissions assigned to role!`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setAssigning(false);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filtered = permissions.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (
      p.name?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q)
    );
    const matchCat = filterCategory === 'all' || getCategory(p.code) === filterCategory;
    return matchSearch && matchCat;
  });

  // Group by category for visual grouping
  const grouped = filtered.reduce((acc, perm) => {
    const cat = getCategory(perm.code);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 p-4 md:p-6">
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
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-200">
                  <UserCog size={22} className="text-white" />
                </div>
                Role Permissions
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Assign permissions to a specific role</p>
            </div>
            <button onClick={fetchPermissions} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all disabled:opacity-50">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ─── Org & Role Selector ──────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Org Selector */}
            <div className="md:col-span-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Organization *</label>
              {loadingOrgs ? (
                <div className="flex items-center gap-2 py-2.5 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Loading...</div>
              ) : (
                <select value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none text-sm transition-all appearance-none cursor-pointer">
                  <option value="">Choose an organization...</option>
                  {orgs.map(org => (
                    <option key={org._id} value={org._id}>{org.name} — {org.city} ({org.companyCode})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Role Selector */}
            <div className="md:col-span-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role *</label>
              {loadingRoles ? (
                <div className="flex items-center gap-2 py-2.5 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Loading roles...</div>
              ) : (
                <select value={roleId} onChange={e => setRoleId(e.target.value)} disabled={!selectedOrgId}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none text-sm transition-all appearance-none cursor-pointer disabled:opacity-50">
                  <option value="">{selectedOrgId ? 'Choose a role...' : 'Select org first'}</option>
                  {roles.map(role => (
                    <option key={role._id} value={role._id}>{role.name} ({role.code})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Assign Button */}
            <div className="md:col-span-2 flex items-center gap-2">
              <div className="px-3 py-2.5 bg-indigo-50 rounded-xl">
                <span className="text-sm font-bold text-indigo-600">{selectedPerms.length}</span>
                <span className="text-xs text-indigo-500 ml-1">sel</span>
              </div>
              <button onClick={handleAssign} disabled={assigning || !roleId.trim() || selectedPerms.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-0.5">
                <Save size={16} />
                {assigning ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Search & Filters ────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-4 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permissions..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none text-sm transition-all" />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button onClick={toggleAll}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              {selectedPerms.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All Visible'}
            </button>
            {selectedPerms.length > 0 && (
              <button onClick={() => setSelectedPerms([])}
                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                <X size={12} /> Clear selection
              </button>
            )}
          </div>
        </div>

        {/* ─── Permission Cards ────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-500 mt-4 text-sm">Loading permissions...</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-20 flex flex-col items-center justify-center text-slate-400">
            <Shield size={48} className="mb-3 opacity-30" />
            <p className="text-lg font-medium">No permissions found</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, perms]) => (
            <div key={cat} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3 bg-slate-50/80 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getCategoryGradient(cat + '_')}`} />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{cat}</h3>
                  <span className="text-xs text-slate-400">({perms.length})</span>
                </div>
                <button onClick={() => toggleCategory(cat)}
                  className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                  {perms.every(p => selectedPerms.includes(p.code)) ? 'Deselect Group' : 'Select Group'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {perms.map(perm => {
                  const isSelected = selectedPerms.includes(perm.code);
                  return (
                    <button
                      key={perm._id || perm.code}
                      onClick={() => togglePerm(perm.code)}
                      className={`group relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-50/80 shadow-md shadow-indigo-100'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-slate-300 group-hover:border-indigo-400'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{perm.name}</p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">{perm.code}</p>
                          {perm.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{perm.description}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
