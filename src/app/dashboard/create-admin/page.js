'use client'
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle, CheckCircle2, UserCog, Building2, Mail, Shield, User,
  ArrowRight, ArrowLeft, Plus, Loader2
} from 'lucide-react';
import { createOrgAdmin, getAllOrgs } from '@/lib/corporateService';

function CreateAdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefilledSchoolId = searchParams.get('schoolId') || '';
  const prefilledOrgName = searchParams.get('orgName') || '';

  const [loading, setLoading] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [createdAdmin, setCreatedAdmin] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    schoolId: prefilledSchoolId,
    accessType: 'owner'
  });

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Fetch all orgs for the dropdown (only if no schoolId prefilled)
  useEffect(() => {
    if (!prefilledSchoolId) {
      const fetchOrgs = async () => {
        setOrgsLoading(true);
        try {
          const data = await getAllOrgs();
          setOrgs(Array.isArray(data) ? data : []);
        } catch (err) {
          showToast('error', 'Failed to load organizations: ' + err.message);
        } finally {
          setOrgsLoading(false);
        }
      };
      fetchOrgs();
    }
  }, [prefilledSchoolId, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      showToast('error', 'First Name and Last Name are required.');
      return;
    }
    if (!formData.email || !formData.schoolId) {
      showToast('error', 'Email and Organization are required.');
      return;
    }
    if (!formData.accessType) {
      showToast('error', 'Please select an access type.');
      return;
    }

    setLoading(true);
    try {
      const data = await createOrgAdmin(formData);
      const adminId = data?.data?._id || data?.admin?._id || data?._id || data?.data?.id || '';
      const adminEmail = formData.email;
      const adminName = `${formData.firstName} ${formData.lastName}`.trim();

      setCreatedAdmin({ id: adminId, email: adminEmail, name: adminName, raw: data });
      showToast('success', `Admin "${adminName}" created successfully!`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setCreatedAdmin(null);
    setFormData({ firstName: '', lastName: '', email: '', schoolId: prefilledSchoolId || '', accessType: 'owner' });
  };

  const handleGoToUser = () => {
    const params = new URLSearchParams();
    params.set('schoolId', formData.schoolId);
    if (createdAdmin?.id) params.set('adminId', createdAdmin.id);
    if (prefilledOrgName) params.set('orgName', prefilledOrgName);
    router.push(`/dashboard/create-user?${params.toString()}`);
  };

  const selectedOrgName = prefilledOrgName || orgs.find(o => (o._id || o.id) === formData.schoolId)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40 p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-medium transition-all animate-slideIn ${
          toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.text}
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-200">
                  <UserCog size={22} className="text-white" />
                </div>
                Create Admin
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Step 3 of 4 — Assign an admin to the organization</p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                Org
              </div>
              <div className="w-4 h-px bg-emerald-400" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                Config
              </div>
              <div className="w-4 h-px bg-purple-400" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full">
                <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</div>
                Admin
              </div>
              <div className="w-4 h-px bg-slate-300" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-full">
                <div className="w-5 h-5 bg-slate-300 text-white rounded-full flex items-center justify-center text-[10px] font-bold">4</div>
                User
              </div>
            </div>
          </div>
        </div>

        {/* Org Context Banner */}
        {(prefilledSchoolId || selectedOrgName) && !createdAdmin && (
          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl border border-purple-100 px-5 py-3 flex items-center gap-3">
            <Building2 size={16} className="text-purple-600" />
            <div className="text-sm">
              <span className="text-slate-500">Organization:</span>{' '}
              <span className="font-semibold text-purple-700">{selectedOrgName || prefilledSchoolId}</span>
            </div>
          </div>
        )}

        {/* ── Success State ── */}
        {createdAdmin ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Admin Created!</h2>
              {createdAdmin.name && (
                <p className="text-lg font-semibold text-slate-700 mt-1">{createdAdmin.name}</p>
              )}
              <p className="text-slate-500 mt-1">
                <span className="font-medium text-slate-600">{createdAdmin.email}</span> has been assigned as{' '}
                <span className="font-semibold text-purple-600">{formData.accessType}</span> admin.
              </p>
              {createdAdmin.id && (
                <p className="text-xs text-slate-400 mt-1 font-mono">Admin ID: {createdAdmin.id}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <button
                  onClick={handleGoToUser}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  Next: Create User
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={handleCreateAnother}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 transition-all"
                >
                  <Plus size={16} />
                  Create Another Admin
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 space-y-5">

              {/* Organization Select */}
              {!prefilledSchoolId && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building2 size={14} className="text-purple-500" />
                    Organization <span className="text-red-400">*</span>
                  </label>
                  {orgsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                      <Loader2 size={14} className="animate-spin" />
                      Loading organizations...
                    </div>
                  ) : (
                    <select
                      name="schoolId"
                      value={formData.schoolId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                    >
                      <option value="">Select an organization...</option>
                      {orgs.map((org) => (
                        <option key={org._id || org.id} value={org._id || org.id}>
                          {org.name} {org.companyCode ? `(${org.companyCode})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User size={14} className="text-purple-500" />
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Anjali"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User size={14} className="text-purple-500" />
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Mehta"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail size={14} className="text-purple-500" />
                  Admin Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@company.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                />
              </div>

              {/* Access Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Shield size={14} className="text-purple-500" />
                  Access Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['owner', 'delegated'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, accessType: type }))}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        formData.accessType === type
                          ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm shadow-purple-100'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-purple-200 hover:text-purple-500'
                      }`}
                    >
                      <div className="font-semibold capitalize">{type}</div>
                      <div className="text-xs mt-0.5 opacity-70">
                        {type === 'owner' ? 'Full control access' : 'Limited delegated access'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/company-config')}
                className="flex items-center gap-2 px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-500 transition-all"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Admin...
                  </>
                ) : (
                  <>
                    <UserCog size={16} />
                    Create Admin
                  </>
                )}
              </button>
            </div>
          </form>
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

export default function CreateAdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    }>
      <CreateAdminPageInner />
    </Suspense>
  );
}
