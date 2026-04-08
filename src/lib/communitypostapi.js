import { AuthManager, BACKEND_CONFIG } from './auth-manager';

const getAPIBaseURL = () => {
  const currentBackend = AuthManager.getCurrentBackend();
  if (!currentBackend) {
    throw new Error('No backend selected');
  }
  return BACKEND_CONFIG[currentBackend].url + '/api/v1';
};

const getHeaders = (isFormData = false) => {
  const currentBackend = AuthManager.getCurrentBackend();
  const token = currentBackend ? AuthManager.getToken(currentBackend) : null;
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const getCommunityGroups = async () => {
  try {
    const API_BASE_URL = getAPIBaseURL();
    const response = await fetch(`${API_BASE_URL}/communityGroup/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.results || result.data || result || [],
    };
  } catch (error) {
    console.error('Error fetching community groups:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch community groups',
      data: []
    };
  }
};

export const createTextPost = async (message, groups = []) => {
  try {
    const API_BASE_URL = getAPIBaseURL();
    const response = await fetch(`${API_BASE_URL}/school/communityPost`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        postType: 'text',
        message,
        groups
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error creating text post:', error);
    return {
      success: false,
      error: error.message || 'Failed to create text post',
    };
  }
};

export const createPollPost = async (message, pollOptions, groups = []) => {
  try {
    const API_BASE_URL = getAPIBaseURL();
    const response = await fetch(`${API_BASE_URL}/school/communityPost`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        postType: 'poll',
        message,
        groups,
        pollOptions
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error creating poll post:', error);
    return {
      success: false,
      error: error.message || 'Failed to create poll post',
    };
  }
};

export const createImagePost = async (message, image, groups = []) => {
  try {
    const API_BASE_URL = getAPIBaseURL();
    const formData = new FormData();
    formData.append('postType', 'image');
    formData.append('message', message);
    formData.append('images', image);

    if (groups.length > 0) {
      groups.forEach(groupId => formData.append('groups', groupId));
    }

    const response = await fetch(`${API_BASE_URL}/school/communityPost`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating image post:', error);
    return { success: false, error: error.message || 'Failed to create image post' };
  }
};

export const createPost = async (postData) => {
  const { postType, message, groups, pollOptions, image } = postData;

  if (postType === 'text') {
    return createTextPost(message, groups);
  }
  
  if (postType === 'poll') {
    return createPollPost(message, pollOptions, groups);
  }
  
  if (postType === 'image') {
    return createImagePost(message, image, groups);
  }
  
  return {
    success: false,
    error: 'Invalid post type'
  };
};

export const getSchoolPosts = async (schoolId) => {
  try {
    const API_BASE_URL = getAPIBaseURL();
    const url = schoolId 
      ? `${API_BASE_URL}/school/communityPost?schoolId=${schoolId}`
      : `${API_BASE_URL}/school/communityPost`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.posts || result.results || result.data || result || [],
    };
  } catch (error) {
    console.error('Error fetching school posts:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch school posts',
      data: []
    };
  }
};

export const uploadSchoolLogo = async (logoFile) => {
  try {
    const API_BASE_URL = getAPIBaseURL();
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await fetch(`${API_BASE_URL}/School/logo`, {
      method: 'POST',
      headers: getHeaders(true), 
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error uploading school logo:', error);
    return { success: false, error: error.message || 'Failed to upload logo' };
  }
};

export const updateSchoolLogo = async (logoFile) => {
  try {
    const API_BASE_URL = getAPIBaseURL();
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await fetch(`${API_BASE_URL}/School/logo/update`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating school logo:', error);
    return { success: false, error: error.message || 'Failed to update logo' };
  }
};