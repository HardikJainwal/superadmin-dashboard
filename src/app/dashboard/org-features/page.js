'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Search, AlertCircle, CheckCircle2, Building2,
  ToggleLeft, ToggleRight, Zap, Loader2, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { getAllFeatures, toggleOrgFeature, getOrgFeatures, getAllOrgs } from '@/lib/corporateService';

export default function OrgFeaturesPage() {
  const [allFeatures, setAllFeatures] = useState([]);
  const [orgFeatureCodes, setOrgFeatureCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [orgId, setOrgId] = useState('');
  const [orgIdApplied, setOrgIdApplied] = useState('');
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [togglingCode, setTogglingCode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [expandedId, setExpandedId] = useState(null);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Fetch all available features ──────────────────────────────────────────────
  const fetchAllFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllFeatures();
      setAllFeatures(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('error', err.message);
      setAllFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAllFeatures(); }, [fetchAllFeatures]);

  // ── Fetch all orgs ────────────────────────────────────────────────────────────
  const fetchOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const data = await getAllOrgs();
      setOrgs(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('error', 'Failed to load organizations');
      setOrgs([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, [showToast]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  // ── Load org's enabled features ───────────────────────────────────────────────
  const loadOrgFeatures = async () => {
    if (!orgId.trim()) {
      showToast('error', 'Please enter an Org ID');
      return;
    }
    setLoadingOrg(true);
    setOrgIdApplied(orgId.trim());
    try {
      const data = await getOrgFeatures(orgId.trim());
      const codes = Array.isArray(data)
        ? data.map(f => f.featureCode || f.code || f).filter(Boolean)
        : [];
      setOrgFeatureCodes(codes);
      showToast('success', `Loaded ${codes.length} enabled features for org`);
    } catch (err) {
      // If the endpoint doesn't exist or returns error, start with empty
      setOrgFeatureCodes([]);
      showToast('error', `Could not load org features: ${err.message}`);
    } finally {
      setLoadingOrg(false);
    }
  };

  // ── Toggle a feature for the org ──────────────────────────────────────────────
  const handleToggle = async (featureCode) => {
    if (!orgIdApplied) {
      showToast('error', 'Please load an Org first');
      return;
    }
    const isCurrentlyEnabled = orgFeatureCodes.includes(featureCode);
    const newEnabled = !isCurrentlyEnabled;

    setTogglingCode(featureCode);
    try {
      await toggleOrgFeature({
        featureCode,
        orgId: orgIdApplied,
        isEnabled: newEnabled
      });
      // Optimistically update local state
      if (newEnabled) {
        setOrgFeatureCodes(prev => [...prev, featureCode]);
      } else {
        setOrgFeatureCodes(prev => prev.filter(c => c !== featureCode));
      }
      showToast('success', `${featureCode} ${newEnabled ? 'enabled' : 'disabled'} for org`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setTogglingCode(null);
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

  const filtered = allFeatures
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

  const enabledCount = allFeatures.filter(f => orgFeatureCodes.includes(f.code)).length;
  const disabledCount = allFeatures.length - enabledCount;

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={14} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 p-4 md:p-6">
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
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-200">
                  <Building2 size={22} className="text-white" />
                </div>
                Org Feature Management
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Enable or disable features for a specific organization</p>
            </div>
            <button
              onClick={fetchAllFeatures}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ─── Org Selector ──────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Organization *</label>
              {loadingOrgs ? (
                <div className="flex items-center gap-2 py-2.5 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Loading organizations...</div>
              ) : (
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="">Choose an organization...</option>
                  {orgs.map(org => (
                    <option key={org._id} value={org._id}>{org.name} — {org.city}, {org.state} ({org.companyCode})</option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={loadOrgFeatures}
              disabled={loadingOrg || !orgId.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-0.5"
            >
              {loadingOrg ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
              {loadingOrg ? 'Loading...' : 'Load Org'}
            </button>
          </div>

          {orgIdApplied && (
            <div className="mt-3 flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl">
              <Info size={14} />
              <span>Managing features for: <strong>{orgs.find(o => o._id === orgIdApplied)?.name || orgIdApplied}</strong></span>
              <code className="ml-auto font-mono text-xs bg-emerald-100 px-1.5 py-0.5 rounded">{orgIdApplied}</code>
            </div>
          )}
        </div>

        {/* ─── Search ──────────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features by name, code, or description..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* ─── Stats ───────────────────────────────────────────────────────── */}
        {orgIdApplied && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Features</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{allFeatures.length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Enabled for Org</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{enabledCount}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Disabled</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{disabledCount}</p>
            </div>
          </div>
        )}

        {/* ─── Feature Cards ───────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-slate-500 mt-4 text-sm">Loading features...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Zap size={48} className="mb-3 opacity-30" />
              <p className="text-lg font-medium">No features found</p>
              <p className="text-sm mt-1">{searchQuery ? 'Try a different search' : 'No features available'}</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('name')}>
                  Feature <SortIcon field="name" />
                </div>
                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('code')}>
                  Code <SortIcon field="code" />
                </div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2 text-center">Org Status</div>
                <div className="col-span-1 text-center">Toggle</div>
                <div className="col-span-1 text-center">Info</div>
              </div>

              {/* Rows */}
              {filtered.map((feature) => {
                const isEnabled = orgFeatureCodes.includes(feature.code);
                const isToggling = togglingCode === feature.code;

                return (
                  <div key={feature._id || feature.code} className="border-b border-slate-100 last:border-b-0 hover:bg-emerald-50/40 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center">
                      {/* Name */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${isEnabled ? 'bg-emerald-400 shadow-sm shadow-emerald-200' : 'bg-slate-300'}`} />
                          <span className="font-semibold text-slate-800">{feature.name}</span>
                        </div>
                      </div>

                      {/* Code */}
                      <div className="col-span-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-mono font-medium">
                          {feature.code}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="col-span-3">
                        <p className="text-sm text-slate-600 line-clamp-1">{feature.description || '—'}</p>
                      </div>

                      {/* Status Badge */}
                      <div className="col-span-2 flex justify-center">
                        {!orgIdApplied ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold">
                            No Org
                          </span>
                        ) : isEnabled ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                            <ToggleRight size={14} />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold">
                            <ToggleLeft size={14} />
                            Disabled
                          </span>
                        )}
                      </div>

                      {/* Toggle Button */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => handleToggle(feature.code)}
                          disabled={!orgIdApplied || isToggling}
                          className={`relative w-12 h-7 rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                            isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 size={14} className="absolute top-1.5 left-4 animate-spin text-white" />
                          ) : (
                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                              isEnabled ? 'left-6' : 'left-1'
                            }`} />
                          )}
                        </button>
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
                            <span className="text-xs font-semibold text-slate-400 uppercase">Feature ID</span>
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
                            <span className="text-xs font-semibold text-slate-400 uppercase">Global Status</span>
                            <p className="text-slate-700 mt-0.5">{feature.isActive ? '✅ Active' : '❌ Inactive'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Description</span>
                            <p className="text-slate-700 mt-0.5">{feature.description || 'No description provided'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
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
