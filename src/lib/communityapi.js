
const API_BASE_URL = 'http://69.62.74.102:3000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
};


const getGroupsCount = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/groups-counts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Failed to fetch groups count' };
    }
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};


const createGroup = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/communityGroup/`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData, 
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Failed to create group' };
    }
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};



const updateGroup = async (groupId, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/communityGroup/${groupId}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: formData, 
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Failed to update group' };
    }
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

const deleteGroup = async (groupId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/communityGroup/${groupId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Failed to delete group' };
    }
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export { getGroupsCount, createGroup, updateGroup, deleteGroup };
