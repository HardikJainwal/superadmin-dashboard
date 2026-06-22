'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, AlertCircle, CheckCircle2, UserCog, Users,
  Shield, Search, Loader2, Check, Info,
  Building2, Plus, X, Mail
} from 'lucide-react';
import { getAllOrgs, getOrgAdmins, getAllRoles, createRole, assignUserRole } from '@/lib/corporateService';

export default function UserRolesPage() {
  // ── Orgs ──
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // ── Admins ──
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  // ── Roles ──
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  // ── Create Role Modal ──
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  // ── Assignment ──
  const [assigning, setAssigning] = useState(false);
  const [recentAssignments, setRecentAssignments] = useState([]);

  // ── UI ──
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Fetch Orgs ──
  const fetchOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const data = await getAllOrgs();
      setOrgs(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('error', err.message);
      setOrgs([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, [showToast]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  // ── When org changes, fetch admins & roles ──
  useEffect(() => {
    if (!selectedOrgId) {
      setAdmins([]);
      setRoles([]);
      setSelectedAdminId('');
      setSelectedRoleId('');
      return;
    }

    const loadData = async () => {
      setLoadingAdmins(true);
      setLoadingRoles(true);
      setSelectedAdminId('');
      setSelectedRoleId('');

      try {
        const [adminsData, rolesData] = await Promise.all([
          getOrgAdmins(selectedOrgId),
          getAllRoles(selectedOrgId)
        ]);
        setAdmins(Array.isArray(adminsData) ? adminsData : []);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (err) {
        showToast('error', err.message);
      } finally {
        setLoadingAdmins(false);
        setLoadingRoles(false);
      }
    };
    loadData();
  }, [selectedOrgId, showToast]);

  // ── Assign Role ──
  const handleAssign = async () => {
    if (!selectedAdminId) return showToast('error', 'Please select an admin');
    if (!selectedRoleId) return showToast('error', 'Please select a role');

    setAssigning(true);
    try {
      await assignUserRole(selectedAdminId, selectedRoleId);
      const admin = admins.find(a => a._id === selectedAdminId);
      const role = roles.find(r => r._id === selectedRoleId);
      const adminLabel = admin?.email || selectedAdminId;
      const roleName = role?.name || selectedRoleId;
      showToast('success', `Role "${roleName}" assigned to ${adminLabel}!`);

      setRecentAssignments(prev => [{
        adminId: selectedAdminId,
        adminEmail: adminLabel,
        roleId: selectedRoleId,
        roleName,
        timestamp: new Date().toLocaleString()
      }, ...prev].slice(0, 10));
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setAssigning(false);
    }
  };

  // ── Create Role ──
  const handleCreateRole = async () => {
    if (!newRoleName.trim() || !newRoleCode.trim()) {
      return showToast('error', 'Please fill in role name and code');
    }
    setCreatingRole(true);
    try {
      await createRole({ name: newRoleName.trim(), code: newRoleCode.trim().toUpperCase(), orgId: selectedOrgId });
      showToast('success', `Role "${newRoleName}" created!`);
      setShowCreateRole(false);
      setNewRoleName('');
      setNewRoleCode('');
      const rolesData = await getAllRoles(selectedOrgId);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setCreatingRole(false);
    }
  };

  const selectedOrg = orgs.find(o => o._id === selectedOrgId);

  const filteredAdmins = admins.filter(a => {
    const q = adminSearch.toLowerCase();
    return !q || a.email?.toLowerCase().includes(q) || a._id?.toLowerCase().includes(q);
  });

  const filteredRoles = roles.filter(r => {
    const q = roleSearch.toLowerCase();
    return !q || r.name?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/40 p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-medium transition-all animate-slideIn ${
          toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.text}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-amber-600" /> Create New Role
              </h3>
              <button onClick={() => setShowCreateRole(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              For org: <strong>{selectedOrg?.name}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role Name *</label>
                <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. Sub-admin" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role Code *</label>
                <input type="text" value={newRoleCode} onChange={e => setNewRoleCode(e.target.value)}
                  placeholder="e.g. SUB-ADMIN" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm font-mono uppercase" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateRole(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreateRole} disabled={creatingRole || !newRoleName.trim() || !newRoleCode.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-amber-200 disabled:opacity-50">
                {creatingRole ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {creatingRole ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-200">
                  <UserCog size={22} className="text-white" />
                </div>
                Admin Role Management
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Select org → pick admin → assign or create roles</p>
            </div>
            <button onClick={fetchOrgs} disabled={loadingOrgs}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all disabled:opacity-50">
              <RefreshCw size={16} className={loadingOrgs ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Flow Guidance Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-sm rounded-2xl border border-amber-100/60 p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0 mt-0.5">
              <UserCog size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">🔧 Org Configuration</p>
              <p className="text-xs text-amber-600/80 mt-0.5">Create roles for an organization and assign them to admins. The <strong>organization must be created</strong> first (Org Onboarding), and <strong>admins must exist</strong> before you can assign roles. After creating roles, assign permissions to them in <strong>Role Permissions</strong>.</p>
            </div>
          </div>
        </div>

        {/* Step 1: Select Organization */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-amber-600" />
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full mr-1">1</span>
            Select Organization
          </h2>
          {loadingOrgs ? (
            <div className="flex items-center gap-3 py-4 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Loading organizations...</div>
          ) : (
            <select value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm transition-all appearance-none cursor-pointer">
              <option value="">Choose an organization...</option>
              {orgs.map(org => (
                <option key={org._id} value={org._id}>{org.name} — {org.city}, {org.state} ({org.companyCode})</option>
              ))}
            </select>
          )}
          {selectedOrg && (
            <div className="mt-3 flex items-center gap-3 text-sm text-amber-700 bg-amber-50 px-4 py-2.5 rounded-xl">
              {selectedOrg.schoolLogo && <img src={selectedOrg.schoolLogo} alt="" className="w-8 h-8 rounded-lg object-cover" />}
              <span><strong>{selectedOrg.name}</strong> · {selectedOrg.city} · HR: {selectedOrg.hrName}</span>
              <code className="ml-auto font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">{selectedOrg._id}</code>
            </div>
          )}
        </div>

        {/* Step 2: Select Admin */}
        {selectedOrgId && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users size={18} className="text-amber-600" />
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full mr-1">2</span>
              Select Admin
              <span className="text-xs font-normal text-slate-400 ml-2">({admins.length} admins)</span>
            </h2>

            {loadingAdmins ? (
              <div className="flex items-center gap-3 py-4 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Loading admins...</div>
            ) : (
              <>
                {admins.length > 3 && (
                  <div className="relative mb-4">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                      placeholder="Search admins by email or ID..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {filteredAdmins.map(admin => {
                    const isSelected = selectedAdminId === admin._id;
                    return (
                      <div key={admin._id} onClick={() => setSelectedAdminId(admin._id)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected ? 'border-amber-400 bg-amber-50/80 shadow-md shadow-amber-100' : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm'
                        }`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                            {admin.email?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                              <Mail size={12} className="text-slate-400 flex-shrink-0" />
                              {admin.email}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">ID: {admin._id}</p>
                            <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              admin.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {admin.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-amber-500 rounded-md flex items-center justify-center flex-shrink-0">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredAdmins.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400 text-sm">No admins found</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Select / Create Role & Assign */}
        {selectedOrgId && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield size={18} className="text-amber-600" />
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full mr-1">3</span>
                Select Role & Assign
                <span className="text-xs font-normal text-slate-400 ml-2">({roles.length} roles)</span>
              </h2>
              <button onClick={() => setShowCreateRole(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-medium text-xs transition-all border border-amber-200">
                <Plus size={14} /> New Role
              </button>
            </div>

            {loadingRoles ? (
              <div className="flex items-center gap-3 py-4 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Loading roles...</div>
            ) : (
              <>
                {roles.length > 4 && (
                  <div className="relative mb-4">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={roleSearch} onChange={e => setRoleSearch(e.target.value)}
                      placeholder="Search roles..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredRoles.map(role => {
                    const isSelected = selectedRoleId === role._id;
                    return (
                      <div key={role._id} onClick={() => setSelectedRoleId(role._id)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected ? 'border-amber-400 bg-amber-50/80 shadow-md shadow-amber-100' : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm'
                        }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${role.enabled ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                              <h3 className="text-sm font-bold text-slate-800 truncate">{role.name}</h3>
                            </div>
                            <p className="text-[11px] font-mono text-slate-500 mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded">{role.code}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{role.permissions?.length || 0} permissions</p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredRoles.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400 text-sm">No roles found. Create one!</div>
                  )}
                </div>

                {/* Assign Button */}
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1 text-sm text-slate-600">
                    {selectedAdminId && selectedRoleId ? (
                      <span>
                        Assign <strong className="text-amber-700">{roles.find(r => r._id === selectedRoleId)?.name}</strong> to{' '}
                        <strong className="text-amber-700">{admins.find(a => a._id === selectedAdminId)?.email || '—'}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400">Select an admin and a role to assign</span>
                    )}
                  </div>
                  <button onClick={handleAssign} disabled={assigning || !selectedAdminId || !selectedRoleId}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-0.5">
                    {assigning ? <Loader2 size={16} className="animate-spin" /> : <UserCog size={16} />}
                    {assigning ? 'Assigning...' : 'Assign Role'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Recent Assignments */}
        {recentAssignments.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Recent Assignments
                <span className="text-xs font-normal text-slate-400 ml-2">(session only)</span>
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {recentAssignments.map((a, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700">{a.adminEmail}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-semibold text-amber-700">{a.roleName}</span>
                  </div>
                  <span className="text-xs text-slate-400">{a.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
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
