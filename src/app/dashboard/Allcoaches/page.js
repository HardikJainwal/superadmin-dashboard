'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, UserCog, Star, Briefcase, Globe2, Award,
  RefreshCw, ChevronDown, X, Users, Filter, Eye, Languages,
  KeyRound, EyeOff
} from 'lucide-react';

import { fetchCoaches } from '@/lib/coachApi';

// ─── Constants ────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: 'all', label: 'All Coaches' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
];

const SPECIALIZATION_COLORS = {
  'Yoga Instructor': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  'Mental Health Support Coach': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400' },
  'Health & Fitness Coach': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  'Weight Management Coach': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
};

const DEFAULT_SPEC_COLOR = { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };

function getSpecColor(spec) {
  return SPECIALIZATION_COLORS[spec] || DEFAULT_SPEC_COLOR;
}

// ─── Star Rating Component ────────────────────────────────
function StarRating({ rating = 0, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.round(rating)
            ? 'text-amber-400 fill-amber-400'
            : 'text-gray-200 fill-gray-200'}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1.5 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Coach Detail Modal ───────────────────────────────────
function CoachDetailModal({ coach, onClose }) {
  if (!coach) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition z-10"
        >
          <X size={16} className="text-gray-600" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 p-8 pb-16 rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
        </div>

        {/* Avatar overlapping */}
        <div className="flex justify-center -mt-12 relative z-10">
          {coach.profilePhoto ? (
            <img
              src={coach.profilePhoto}
              alt="Coach profile"
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 border-4 border-white shadow-lg items-center justify-center ${coach.profilePhoto ? 'hidden' : 'flex'}`}
          >
            <UserCog size={36} className="text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Specializations */}
          <div className="text-center mb-5">
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {coach.specialization?.length > 0 ? (
                coach.specialization.map((spec, i) => {
                  const color = getSpecColor(spec);
                  return (
                    <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${color.bg} ${color.text} border ${color.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                      {spec}
                    </span>
                  );
                })
              ) : (
                <span className="text-sm text-gray-400 italic">No specialization listed</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Briefcase size={16} className="mx-auto text-teal-500 mb-1" />
              <p className="text-lg font-bold text-gray-900">
                {coach.experienceYear != null ? `${coach.experienceYear}yr` : '—'}
              </p>
              <p className="text-xs text-gray-500">Experience</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Star size={16} className="mx-auto text-amber-400 mb-1" />
              <p className="text-lg font-bold text-gray-900">{(coach.rating || 0).toFixed(1)}</p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Languages size={16} className="mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-gray-900">{coach.languages?.length || 0}</p>
              <p className="text-xs text-gray-500">Languages</p>
            </div>
          </div>

          {/* Languages */}
          {coach.languages?.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {coach.languages.map((lang, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {coach.bio && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bio</h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100 whitespace-pre-wrap">
                {coach.bio}
              </p>
            </div>
          )}

          {/* Coach ID */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-mono text-center">
              ID: {coach._id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AllCoachesPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('');
  const [selectedCoach, setSelectedCoach] = useState(null);

  // Token management
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [showTokenValue, setShowTokenValue] = useState(false);

  // Load saved token on mount
  useEffect(() => {
    const saved = localStorage.getItem('coach_api_token');
    if (saved) setToken(saved);
  }, []);

  // Save token to localStorage whenever it changes
  const handleTokenChange = (val) => {
    setToken(val);
    if (val) {
      localStorage.setItem('coach_api_token', val);
    } else {
      localStorage.removeItem('coach_api_token');
    }
  };

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('No API token set. Click the 🔑 icon to add one.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCoaches(typeFilter, token);
      setCoaches(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message);
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, token]);

  useEffect(() => { if (token) load(); }, [load, token]);

  // Derive unique specializations for filter
  const allSpecs = [...new Set(coaches.flatMap(c => c.specialization || []).filter(Boolean))];

  // Filter coaches
  const filteredCoaches = coaches.filter(c => {
    const matchesSearch =
      !searchQuery ||
      c.specialization?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.languages?.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpec =
      !specFilter ||
      c.specialization?.includes(specFilter);

    return matchesSearch && matchesSpec;
  });
  


  // Stats
  const totalCoaches = coaches.length;
  const avgExperience = coaches.length
    ? (coaches.reduce((sum, c) => sum + (c.experienceYear || 0), 0) / coaches.length).toFixed(1)
    : 0;
  const avgRating = coaches.length
    ? (coaches.reduce((sum, c) => sum + (c.rating || 0), 0) / coaches.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl shadow-teal-200/50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white rounded-full" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1 tracking-tight">Coach Management</h1>
              <p className="text-teal-100 text-sm">View and manage all registered coaches on the platform</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
                <Users size={14} /> {totalCoaches} Coaches
              </div>
              {/* <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
                <Briefcase size={14} /> {avgExperience} Avg Yrs
              </div> */}
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
                <Star size={14} /> {avgRating} Avg Rating
              </div>
            </div>
          </div>
        </div>

        {/* ── Token Input (hidden by default) ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className={`p-2.5 rounded-lg border transition-all duration-200 ${
              showTokenInput
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : token
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                  : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
            }`}
            title={token ? 'Token set — click to edit' : 'Set API token'}
          >
            <KeyRound size={16} />
          </button>

          {showTokenInput && (
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2.5 animate-in slide-in-from-left-2 duration-200">
              <div className="relative flex-1">
                <input
                  type={showTokenValue ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  placeholder="Paste x-access-token here…"
                  className="w-full pr-10 py-1 text-sm font-mono bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400"
                />
                <button
                  onClick={() => setShowTokenValue(!showTokenValue)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition"
                >
                  {showTokenValue ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {token && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                  ✓ Saved
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by specialization, bio, or language…"
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition text-sm"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <div className="flex gap-1.5">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${typeFilter === opt.value
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specialization Filter */}
            {allSpecs.length > 0 && (
              <div className="relative">
                <select
                  value={specFilter}
                  onChange={(e) => setSpecFilter(e.target.value)}
                  className="pl-3 pr-8 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:border-teal-500 focus:outline-none transition appearance-none bg-white cursor-pointer"
                >
                  <option value="">All Specializations</option>
                  {allSpecs.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            {filteredCoaches.length} coach{filteredCoaches.length !== 1 ? 'es' : ''} found
          </p>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-teal-500" />
            <p className="text-gray-500 text-sm">Loading coaches…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
            <p className="text-red-600 font-medium mb-3">{error}</p>
            <button onClick={load} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition">
              Retry
            </button>
          </div>
        ) : filteredCoaches.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <UserCog size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No coaches found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCoaches.map(coach => (
              <CoachCard
                key={coach._id}
                coach={coach}
                onView={() => setSelectedCoach(coach)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCoach && (
        <CoachDetailModal coach={selectedCoach} onClose={() => setSelectedCoach(null)} />
      )}
    </div>
  );
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COACH CARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CoachCard({ coach, onView }) {
  const hasPhoto = coach.profilePhoto && !coach.profilePhoto.includes('example.com');

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-teal-100/50 hover:border-teal-200 transition-all duration-300">
      {/* Card Header */}
      <div className="bg-gradient-to-br from-teal-500/5 via-cyan-500/5 to-blue-500/5 p-5 pb-3 relative">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {hasPhoto ? (
              <img
                src={coach.profilePhoto}
                alt="Coach"
                className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 border-2 border-white shadow-md items-center justify-center group-hover:scale-105 transition-transform duration-300 ${hasPhoto ? 'hidden' : 'flex'}`}
            >
              <UserCog size={24} className="text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Specialization chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {coach.specialization?.length > 0 ? (
                coach.specialization.map((spec, i) => {
                  const color = getSpecColor(spec);
                  return (
                    <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color.bg} ${color.text} border ${color.border}`}>
                      <span className={`w-1 h-1 rounded-full ${color.dot}`} />
                      {spec}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-gray-400 italic px-2 py-0.5">No specialization</span>
              )}
            </div>

            {/* Rating */}
            <StarRating rating={coach.rating || 0} />
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 pt-3 space-y-3">
        {/* Stats Row */}
        <div className="flex items-center gap-4">
          {coach.experienceYear != null && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Briefcase size={13} className="text-teal-500" />
              <span className="font-semibold">{coach.experienceYear}</span>
              <span className="text-gray-400 text-xs">yr{coach.experienceYear !== 1 ? 's' : ''} exp</span>
            </div>
          )}
          {coach.languages?.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Globe2 size={13} className="text-blue-500" />
              <span className="text-xs text-gray-500">{coach.languages.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Bio preview */}
        {coach.bio && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
            {coach.bio}
          </p>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-300 font-mono">{coach._id?.slice(-8)}</span>
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors duration-200"
          >
            <Eye size={13} />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}


export default AllCoachesPage;
