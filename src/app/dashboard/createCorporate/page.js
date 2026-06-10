'use client'
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, CheckCircle2, Building2, User, Package, Calendar,
  ArrowRight, Plus, RotateCcw
} from 'lucide-react';
import { createOrg } from '@/lib/corporateService';

const COACH_TYPES = [
  "Addiction Recovery Coach",
  "Yoga Instructor",
  "Arthritis and Joint Health Coach",
  "Ayurveda Consultant",
  "Cardiovascular Health Coach",
  "Chronic Pain Management Coach",
  "Dermatologist Consultant",
  "Detox and Clean Eating Coach",
  "Diabetes Management Coach",
  "Health & Fitness Coach",
  "Holistic Wellness Coach",
  "Immunity Coach for Kids",
  "Lifestyle Transformation Coach",
  "Mental Health Support Coach",
  "Parenting Wellness Coach",
  "Post-Surgery Recovery Coach",
  "Relationship and Couples Coach",
  "Reproductive Health Coach",
  "Skin and Beauty Wellness Coach",
  "Sleep Wellness Coach",
  "Therapeutic Coach",
  "Weight Management Coach",
  "Women's Health Coach",
  "Work-Life Balance Coach",
  "Workplace Stress Coach",
  "Financial Wellness Coach",
  "Communication Coach",
  "Leadership Coach"
];

const INITIAL_FORM = {
  uid: '',
  name: '',
  Address: '',
  city: '',
  state: '',
  pincode: '',
  companyCode: '',
  hrName: '',
  packageDetails: {
    name: '',
    studentCount: '',
    groupSize: '',
    groupCount: '',
    sessionCount: '',
    monthPlan: '',
    coachType: [],
    costperStudentpermonth: '',
    startDate: '',
    endDate: ''
  }
};

// ── Reusable Input (defined outside component to prevent re-mount on state change) ──
const FormInput = ({ label, icon: Icon, required = true, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
      {Icon && <Icon size={14} className="text-purple-500" />}
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      {...props}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
    />
  </div>
);

export default function CreateCorporatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdOrg, setCreatedOrg] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('package.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        packageDetails: {
          ...prev.packageDetails,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleCoachType = (coach) => {
    setFormData(prev => {
      const current = prev.packageDetails.coachType;
      const updated = current.includes(coach)
        ? current.filter(c => c !== coach)
        : [...current, coach];
      return {
        ...prev,
        packageDetails: { ...prev.packageDetails, coachType: updated }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        uid: parseInt(formData.uid),
        packageDetails: {
          ...formData.packageDetails,
          studentCount: parseInt(formData.packageDetails.studentCount),
          groupSize: parseInt(formData.packageDetails.groupSize),
          groupCount: parseInt(formData.packageDetails.groupCount),
          sessionCount: parseInt(formData.packageDetails.sessionCount),
          monthPlan: parseInt(formData.packageDetails.monthPlan),
          costperStudentpermonth: parseFloat(formData.packageDetails.costperStudentpermonth)
        }
      };

      const data = await createOrg(payload);
      const orgId = data?.data?._id || data?.school?._id || data?._id || data?.data?.schoolId || '';
      const orgName = data?.data?.name || data?.school?.name || formData.name;

      setCreatedOrg({ id: orgId, name: orgName, raw: data });
      showToast('success', `Organization "${orgName}" created successfully!`);
      setFormData(INITIAL_FORM);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setCreatedOrg(null);
    setFormData(INITIAL_FORM);
  };

  const handleGoToConfig = () => {
    const params = new URLSearchParams();
    if (createdOrg?.id) params.set('companyId', createdOrg.id);
    if (createdOrg?.name) params.set('orgName', createdOrg.name);
    router.push(`/dashboard/company-config?${params.toString()}`);
  };

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

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-200">
                  <Building2 size={22} className="text-white" />
                </div>
                Create Organization
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Step 1 of 4 — Set up a new corporate organization</p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full">
                <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                Org
              </div>
              <div className="w-4 h-px bg-slate-300" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-full">
                <div className="w-5 h-5 bg-slate-300 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
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

        {/* ── Success State ── */}
        {createdOrg ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Organization Created!</h2>
              <p className="text-slate-500 mt-2">
                <span className="font-semibold text-slate-700">{createdOrg.name}</span> has been successfully set up.
              </p>
              {createdOrg.id && (
                <p className="text-xs text-slate-400 mt-1 font-mono">ID: {createdOrg.id}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <button
                  onClick={handleGoToConfig}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  Next: Configure Limits
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={handleCreateAnother}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 transition-all"
                >
                  <Plus size={16} />
                  Create Another Org
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-purple-600" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="UID" name="uid" type="number" value={formData.uid} onChange={handleChange} placeholder="1001" />
                <FormInput label="Organization Name" name="name" value={formData.name} onChange={handleChange} placeholder="Green Valley Corp" />
                <div className="md:col-span-2">
                  <FormInput label="Address" name="Address" value={formData.Address} onChange={handleChange} placeholder="Sector 21, Dwarka" />
                </div>
                <FormInput label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Delhi" />
                <FormInput label="State" name="state" value={formData.state} onChange={handleChange} placeholder="Delhi" />
                <FormInput label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="110075" />
                <FormInput label="Company Code" name="companyCode" value={formData.companyCode} onChange={handleChange} placeholder="COMP123" />
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User size={18} className="text-purple-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="HR Name" name="hrName" value={formData.hrName} onChange={handleChange} placeholder="Anjali Mehta" />
              </div>
            </div>

            {/* Package Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package size={18} className="text-purple-600" />
                Package Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormInput label="Package Name" name="package.name" value={formData.packageDetails.name} onChange={handleChange} placeholder="Premium Package" />
                </div>
                <FormInput label="Student/Employee Count" name="package.studentCount" type="number" value={formData.packageDetails.studentCount} onChange={handleChange} placeholder="500" />
                <FormInput label="Group Size" name="package.groupSize" type="number" value={formData.packageDetails.groupSize} onChange={handleChange} placeholder="25" />
                <FormInput label="Group Count" name="package.groupCount" type="number" value={formData.packageDetails.groupCount} onChange={handleChange} placeholder="20" />
                <FormInput label="Session Count" name="package.sessionCount" type="number" value={formData.packageDetails.sessionCount} onChange={handleChange} placeholder="12" />
                <FormInput label="Month Plan" name="package.monthPlan" type="number" value={formData.packageDetails.monthPlan} onChange={handleChange} placeholder="6" />
                <FormInput label="Cost per Student/Month (₹)" name="package.costperStudentpermonth" type="number" step="0.01" value={formData.packageDetails.costperStudentpermonth} onChange={handleChange} placeholder="1200" />

                {/* Coach Types - Chips */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Coach Types <span className="text-red-400">*</span>
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      ({formData.packageDetails.coachType.length} selected)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {COACH_TYPES.map((coach) => {
                      const selected = formData.packageDetails.coachType.includes(coach);
                      return (
                        <button
                          key={coach}
                          type="button"
                          onClick={() => toggleCoachType(coach)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selected
                              ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300 hover:text-purple-600'
                          }`}
                        >
                          {coach}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} className="text-purple-500" />
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="package.startDate"
                    value={formData.packageDetails.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} className="text-purple-500" />
                    End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="package.endDate"
                    value={formData.packageDetails.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    <Building2 size={16} />
                    Create Organization
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFormData(INITIAL_FORM)}
                className="px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-500 transition-all"
              >
                <RotateCcw size={16} />
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