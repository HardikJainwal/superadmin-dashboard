'use client'
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle, CheckCircle2, Settings2, Building2, Users, Shield,
  ArrowRight, ArrowLeft, Loader2
} from 'lucide-react';
import { initCompanyConfig, getAllOrgs } from '@/lib/corporateService';

function CompanyConfigPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefilledCompanyId = searchParams.get('companyId') || '';
  const prefilledOrgName = searchParams.get('orgName') || '';

  const [loading, setLoading] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [configDone, setConfigDone] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    companyId: prefilledCompanyId,
    maxRoles: 5,
    maxEmployees: 100
  });

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Fetch all orgs for dropdown (only if no companyId prefilled)
  useEffect(() => {
    if (!prefilledCompanyId) {
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
  }, [prefilledCompanyId, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyId) {
      showToast('error', 'Please select an organization.');
      return;
    }
    if (!formData.maxRoles || !formData.maxEmployees) {
      showToast('error', 'Max Roles and Max Employees are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        companyId: formData.companyId,
        maxRoles: parseInt(formData.maxRoles),
        maxEmployees: parseInt(formData.maxEmployees)
      };

      await initCompanyConfig(payload);

      setConfigDone({
        companyId: formData.companyId,
        maxRoles: payload.maxRoles,
        maxEmployees: payload.maxEmployees
      });
      showToast('success', 'Company configuration saved successfully!');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToAdmin = () => {
    const params = new URLSearchParams();
    if (configDone?.companyId) params.set('schoolId', configDone.companyId);
    if (prefilledOrgName) params.set('orgName', prefilledOrgName);
    router.push(`/dashboard/create-admin?${params.toString()}`);
  };

  const selectedOrgName = prefilledOrgName || orgs.find(o => (o._id || o.id) === formData.companyId)?.name || '';

  // Preset options for quick selection
  const ROLE_PRESETS = [3, 5, 10, 15, 20];
  const EMPLOYEE_PRESETS = [50, 100, 250, 500, 1000];

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
                  <Settings2 size={22} className="text-white" />
                </div>
                Company Config
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Step 2 of 4 — Configure organization limits</p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                Org
              </div>
              <div className="w-4 h-px bg-purple-400" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full">
                <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                Config
              </div>
              <div className="w-4 h-px bg-slate-300" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-full">
                <div className="w-5 h-5 bg-slate-300 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</div>
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
        {(prefilledCompanyId || selectedOrgName) && !configDone && (
          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl border border-purple-100 px-5 py-3 flex items-center gap-3">
            <Building2 size={16} className="text-purple-600" />
            <div className="text-sm">
              <span className="text-slate-500">Organization:</span>{' '}
              <span className="font-semibold text-purple-700">{selectedOrgName || prefilledCompanyId}</span>
            </div>
          </div>
        )}

        {/* ── Success State ── */}
        {configDone ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Configuration Saved!</h2>
              <p className="text-slate-500 mt-2">
                Organization limits have been configured successfully.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <div className="flex items-center gap-3 px-5 py-3 bg-purple-50 rounded-xl border border-purple-100">
                  <Shield size={18} className="text-purple-600" />
                  <div className="text-left">
                    <div className="text-xs text-slate-500">Max Roles</div>
                    <div className="text-lg font-bold text-purple-700">{configDone.maxRoles}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <Users size={18} className="text-indigo-600" />
                  <div className="text-left">
                    <div className="text-xs text-slate-500">Max Employees</div>
                    <div className="text-lg font-bold text-indigo-700">{configDone.maxEmployees}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <button
                  onClick={handleGoToAdmin}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  Next: Create Admin
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 space-y-6">

              {/* Organization Select (if not prefilled) */}
              {!prefilledCompanyId && (
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
                      name="companyId"
                      value={formData.companyId}
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

              {/* Max Roles */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Shield size={14} className="text-purple-500" />
                  Max Roles <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-3">Maximum number of roles this organization can create</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ROLE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, maxRoles: preset }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        parseInt(formData.maxRoles) === preset
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  name="maxRoles"
                  min="1"
                  value={formData.maxRoles}
                  onChange={handleChange}
                  required
                  placeholder="5"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                />
              </div>

              {/* Max Employees */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Users size={14} className="text-purple-500" />
                  Max Employees <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-3">Maximum number of employees/users this organization can have</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {EMPLOYEE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, maxEmployees: preset }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        parseInt(formData.maxEmployees) === preset
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  name="maxEmployees"
                  min="1"
                  value={formData.maxEmployees}
                  onChange={handleChange}
                  required
                  placeholder="100"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                />
              </div>

              {/* Summary preview */}
              {formData.companyId && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100/60 p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Configuration Summary</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-purple-500" />
                      <span className="text-sm text-slate-600">Roles:</span>
                      <span className="text-sm font-bold text-purple-700">{formData.maxRoles || '–'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-indigo-500" />
                      <span className="text-sm text-slate-600">Employees:</span>
                      <span className="text-sm font-bold text-indigo-700">{formData.maxEmployees || '–'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/createCorporate')}
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
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <Settings2 size={16} />
                    Save Configuration
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

export default function CompanyConfigPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    }>
      <CompanyConfigPageInner />
    </Suspense>
  );
}
