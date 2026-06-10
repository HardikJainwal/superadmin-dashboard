'use client'
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle, CheckCircle2, UserPlus, Building2, Mail, Phone,
  Heart, Shield, Camera, Briefcase, ArrowLeft, Plus, Loader2,
  User, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { createUser, getAllOrgs, getOrgAdmins } from '@/lib/corporateService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

const INITIAL_FORM = {
  email: '',
  firstName: '',
  lastName: '',
  dateofBirth: '',
  gender: '',
  bloodGroup: '',
  phoneNumber: '',
  emergencyContact: { name: '', number: '' },
  allergies: [],
  photo: '',
  created_by_user_id: '',
  createdByModel: 'schooladmin',
  schoolId: '',
  employeeCode: '',
  companyCode: ''
};

// ── Reusable Input (defined outside component to prevent re-mount on state change) ──
const FormInput = ({ label, icon: Icon, required = false, ...props }) => (
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

function CreateUserPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefilledSchoolId = searchParams.get('schoolId') || '';
  const prefilledAdminId = searchParams.get('adminId') || '';
  const prefilledOrgName = searchParams.get('orgName') || '';

  const [loading, setLoading] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [createdUser, setCreatedUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [allergyInput, setAllergyInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState({
    ...INITIAL_FORM,
    schoolId: prefilledSchoolId,
    created_by_user_id: prefilledAdminId
  });

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Fetch orgs if not prefilled
  useEffect(() => {
    if (!prefilledSchoolId) {
      const fetchOrgs = async () => {
        setOrgsLoading(true);
        try {
          const data = await getAllOrgs();
          setOrgs(Array.isArray(data) ? data : []);
        } catch (err) {
          showToast('error', 'Failed to load organizations');
        } finally {
          setOrgsLoading(false);
        }
      };
      fetchOrgs();
    }
  }, [prefilledSchoolId, showToast]);

  // Fetch admins when schoolId changes (and no prefilled adminId)
  useEffect(() => {
    if (formData.schoolId && !prefilledAdminId) {
      const fetchAdmins = async () => {
        setAdminsLoading(true);
        try {
          const data = await getOrgAdmins(formData.schoolId);
          setAdmins(Array.isArray(data) ? data : []);
        } catch (err) {
          // Admin list may not be available — that's ok
          setAdmins([]);
        } finally {
          setAdminsLoading(false);
        }
      };
      fetchAdmins();
    }
  }, [formData.schoolId, prefilledAdminId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !formData.allergies.includes(trimmed)) {
      setFormData(prev => ({ ...prev, allergies: [...prev.allergies, trimmed] }));
      setAllergyInput('');
    }
  };

  const removeAllergy = (allergy) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }));
  };

  const handleAllergyKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAllergy();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName || !formData.schoolId) {
      showToast('error', 'Email, First Name, and Organization are required.');
      return;
    }
    if (!formData.created_by_user_id) {
      showToast('error', 'Admin/Owner ID is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        emergencyContact: {
          name: formData.emergencyContact.name,
          number: formData.emergencyContact.number ? parseInt(formData.emergencyContact.number) : undefined
        }
      };

      // Clean up empty optional fields
      if (!payload.photo) delete payload.photo;
      if (!payload.bloodGroup) delete payload.bloodGroup;
      if (payload.allergies.length === 0) delete payload.allergies;
      if (!payload.emergencyContact.name && !payload.emergencyContact.number) {
        delete payload.emergencyContact;
      }

      const data = await createUser(payload);
      const userId = data?.data?._id || data?.student?._id || data?._id || '';

      setCreatedUser({ id: userId, name: `${formData.firstName} ${formData.lastName}`, raw: data });
      showToast('success', `User "${formData.firstName} ${formData.lastName}" created successfully!`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setCreatedUser(null);
    setFormData({
      ...INITIAL_FORM,
      schoolId: prefilledSchoolId || formData.schoolId,
      created_by_user_id: prefilledAdminId || formData.created_by_user_id,
      companyCode: formData.companyCode,
      createdByModel: 'schooladmin'
    });
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

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-200">
                  <UserPlus size={22} className="text-white" />
                </div>
                Create User
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Step 4 of 4 — Add employees/students to the organization</p>
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
              <div className="w-4 h-px bg-emerald-400" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                Admin
              </div>
              <div className="w-4 h-px bg-purple-400" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full">
                <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">4</div>
                User
              </div>
            </div>
          </div>
        </div>

        {/* Org Context Banner */}
        {(prefilledSchoolId || prefilledOrgName) && !createdUser && (
          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl border border-purple-100 px-5 py-3 flex items-center gap-3">
            <Building2 size={16} className="text-purple-600" />
            <div className="text-sm">
              <span className="text-slate-500">Organization:</span>{' '}
              <span className="font-semibold text-purple-700">{prefilledOrgName || prefilledSchoolId}</span>
            </div>
            {prefilledAdminId && (
              <>
                <div className="w-px h-4 bg-purple-200" />
                <div className="text-sm">
                  <span className="text-slate-500">Admin:</span>{' '}
                  <span className="font-mono text-xs text-purple-600">{prefilledAdminId}</span>
                </div>
              </>
            )}
          </div>
        )}
       

        {/* ── Success State ── */}
        {createdUser ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">User Created!</h2>
              <p className="text-slate-500 mt-2">
                <span className="font-semibold text-slate-700">{createdUser.name}</span> has been added to the organization.
              </p>
              {createdUser.id && (
                <p className="text-xs text-slate-400 mt-1 font-mono">User ID: {createdUser.id}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <button
                  onClick={handleCreateAnother}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Plus size={16} />
                  Create Another User
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Organization & Admin Selection */}
            {(!prefilledSchoolId || !prefilledAdminId) && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building2 size={18} className="text-purple-600" />
                  Organization & Admin
                </h2>

                {!prefilledSchoolId && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Organization <span className="text-red-400">*</span>
                    </label>
                    {orgsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                        <Loader2 size={14} className="animate-spin" /> Loading...
                      </div>
                    ) : (
                      <select
                        name="schoolId"
                        value={formData.schoolId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                      >
                        <option value="">Select organization...</option>
                        {orgs.map((org) => (
                          <option key={org._id || org.id} value={org._id || org.id}>
                            {org.name} {org.companyCode ? `(${org.companyCode})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {!prefilledAdminId && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Admin / Owner ID <span className="text-red-400">*</span>
                    </label>
                    {adminsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                        <Loader2 size={14} className="animate-spin" /> Loading admins...
                      </div>
                    ) : admins.length > 0 ? (
                      <select
                        name="created_by_user_id"
                        value={formData.created_by_user_id}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                      >
                        <option value="">Select admin...</option>
                        {admins.map((admin) => (
                          <option key={admin._id || admin.id} value={admin._id || admin.id}>
                            {admin.email || admin.name} ({admin.accessType || 'admin'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="created_by_user_id"
                        value={formData.created_by_user_id}
                        onChange={handleChange}
                        required
                        placeholder="Enter admin/owner ID"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm font-mono transition-all"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Personal Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User size={18} className="text-purple-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="First Name" icon={User} required name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Eileen" />
                <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Sharma" />
                <FormInput label="Email" icon={Mail} required name="email" type="email" value={formData.email} onChange={handleChange} placeholder="user@company.com" />
                <FormInput label="Phone Number" icon={Phone} name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="9246542014" />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} className="text-purple-500" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateofBirth"
                    value={formData.dateofBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
                  <div className="flex gap-2">
                    {GENDERS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          formData.gender === g
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-purple-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase size={18} className="text-purple-600" />
                Employee Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Employee Code" icon={Briefcase} required name="employeeCode" value={formData.employeeCode} onChange={handleChange} placeholder="EMP001" />
                <FormInput label="Company Code" icon={Building2} required name="companyCode" value={formData.companyCode} onChange={handleChange} placeholder="COMP" />
              </div>
            </div>

            {/* Advanced/Optional Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Heart size={18} className="text-purple-600" />
                  Health & Additional Info
                  <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>
                </h2>
                {showAdvanced ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>

              {showAdvanced && (
                <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Blood Group */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Blood Group</label>
                      <div className="flex flex-wrap gap-2">
                        {BLOOD_GROUPS.map((bg) => (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, bloodGroup: prev.bloodGroup === bg ? '' : bg }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              formData.bloodGroup === bg
                                ? 'bg-red-500 text-white shadow-sm'
                                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-red-200'
                            }`}
                          >
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Photo URL */}
                    <div>
                      <FormInput label="Photo URL" icon={Camera} name="photo" value={formData.photo} onChange={handleChange} placeholder="https://..." />
                      {formData.photo && (
                        <div className="mt-2 w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                          <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Allergies</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        onKeyDown={handleAllergyKeyDown}
                        placeholder="Type and press Enter..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={addAllergy}
                        className="px-4 py-2.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-200 transition-all"
                      >
                        Add
                      </button>
                    </div>
                    {formData.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.allergies.map((a) => (
                          <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium">
                            {a}
                            <button type="button" onClick={() => removeAllergy(a)} className="hover:text-orange-900">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Shield size={14} className="text-purple-500" />
                      Emergency Contact
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        name="emergency.name"
                        value={formData.emergencyContact.name}
                        onChange={handleChange}
                        placeholder="Contact Name"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                      />
                      <input
                        name="emergency.number"
                        value={formData.emergencyContact.number}
                        onChange={handleChange}
                        placeholder="Contact Number"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/create-admin')}
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
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Create User
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

export default function CreateUserPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    }>
      <CreateUserPageInner />
    </Suspense>
  );
}
