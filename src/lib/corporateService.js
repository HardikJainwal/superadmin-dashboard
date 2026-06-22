const BASE_URL = 'https://api.humanova.live/api/v1';

const getAuthToken = () => {
  return localStorage.getItem('corporate_token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// ─── Features ───────────────────────────────────────────────────────────────────

// GET all features (no auth required)
export const getAllFeatures = async () => {
  const response = await fetch(`${BASE_URL}/allfeatures`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch features (${response.status})`);
  }
  const data = await response.json();
  // API returns { features: [...] }
  return data.features || data.data || data || [];
};

// POST create a new feature
export const createFeature = async ({ name, code, description, isActive = true }) => {
  const response = await fetch(`${BASE_URL}/features`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, code, description, isActive })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create feature (${response.status})`);
  }
  return response.json();
};

// ─── Permissions ────────────────────────────────────────────────────────────────

// GET all permissions (auth required)
export const getAllPermissions = async () => {
  const response = await fetch(`${BASE_URL}/permissions`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch permissions (${response.status})`);
  }
  const data = await response.json();
  return data.permissions || data.data || data || [];
};

// POST create a new permission
export const createPermission = async ({ name, code, description }) => {
  const response = await fetch(`${BASE_URL}/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, code, description })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create permission (${response.status})`);
  }
  return response.json();
};

// ─── Role Permissions ───────────────────────────────────────────────────────────

// POST assign permissions to a role
export const assignRolePermissions = async (roleId, permissionCodes) => {
  const response = await fetch(`${BASE_URL}/roles/${roleId}/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ permissionCodes })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to assign permissions (${response.status})`);
  }
  return response.json();
};

// ─── Org Feature Toggling ───────────────────────────────────────────────────────

// POST enable/disable a feature for a specific org
export const toggleOrgFeature = async ({ featureCode, orgId, isEnabled }) => {
  const response = await fetch(`${BASE_URL}/org/features`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ featureCode, orgId, isEnabled })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to toggle org feature (${response.status})`);
  }
  return response.json();
};

// GET features enabled for a specific org
export const getOrgFeatures = async (orgId) => {
  const response = await fetch(`${BASE_URL}/org/${orgId}/features`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch org features (${response.status})`);
  }
  const data = await response.json();
  return data.features || data.data || data || [];
};

// ─── Organizations ──────────────────────────────────────────────────────────────

// GET all organizations
export const getAllOrgs = async () => {
  const response = await fetch(`${BASE_URL}/all-org`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch organizations (${response.status})`);
  }
  const data = await response.json();
  return data.data || data || [];
};

// ─── Admins ─────────────────────────────────────────────────────────────────────

// GET admins for a specific org
export const getOrgAdmins = async (schoolId, isActive = true) => {
  const response = await fetch(`${BASE_URL}/superAdmin/admins?schoolId=${schoolId}&isActive=${isActive}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch admins (${response.status})`);
  }
  const data = await response.json();
  return data.results || data.data || data || [];
};

// ─── Roles ──────────────────────────────────────────────────────────────────────

// GET all roles (optionally filtered by orgId)
export const getAllRoles = async (orgId) => {
  const url = orgId ? `${BASE_URL}/roles?orgId=${orgId}` : `${BASE_URL}/roles`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch roles (${response.status})`);
  }
  const data = await response.json();
  return data.roles || data.data || data || [];
};

// POST create a new role
export const createRole = async ({ name, code, orgId }) => {
  const response = await fetch(`${BASE_URL}/roles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, code, orgId })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create role (${response.status})`);
  }
  return response.json();
};

// ─── User Role Assignment ───────────────────────────────────────────────────────

// PUT assign a role to a user
export const assignUserRole = async (userId, roleId) => {
  const response = await fetch(`${BASE_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ roleId })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to assign role (${response.status})`);
  }
  return response.json();
};

// ─── Organization (School/Corporate) Creation ───────────────────────────────────

// POST create a new organization
export const createOrg = async (payload) => {
  const response = await fetch(`${BASE_URL}/superAdmin/createSchool`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create organization (${response.status})`);
  }
  return response.json();
};

// ─── Admin Creation ─────────────────────────────────────────────────────────────

// POST create an admin for an organization
export const createOrgAdmin = async ({ email, firstName, lastName, schoolId, accessType }) => {
  const response = await fetch(`${BASE_URL}/school/create-school-admin`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, firstName, lastName, schoolId, accessType })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create admin (${response.status})`);
  }
  return response.json();
};

// ─── Company Config ─────────────────────────────────────────────────────────────

// POST initialize company config (max roles, max employees)
export const initCompanyConfig = async ({ companyId, maxRoles, maxEmployees }) => {
  const response = await fetch(`${BASE_URL}/company-config/init`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ companyId, maxRoles, maxEmployees })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to initialize company config (${response.status})`);
  }
  return response.json();
};

// ─── User (Student/Employee) Creation ───────────────────────────────────────────

// POST create a user under an organization
export const createUser = async (payload) => {
  const response = await fetch(`${BASE_URL}/student/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create user (${response.status})`);
  }
  return response.json();
};

export const CorporateService = {
  getAllFeatures,
  createFeature,
  getAllPermissions,
  createPermission,
  assignRolePermissions,
  toggleOrgFeature,
  getOrgFeatures,
  getAllOrgs,
  getOrgAdmins,
  getAllRoles,
  createRole,
  assignUserRole,
  createOrg,
  createOrgAdmin,
  initCompanyConfig,
  createUser
};
