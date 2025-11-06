const API_BASE_URL = "http://69.62.74.102:3000/api/v1";
const API_BASE_temp_URL = "http://localhost:3000/api/v1";

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Get all schools with post counts
export const getAllSchools = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/schools`, {
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
      data: result.schools || [],
      total: result.total || 0,
      page: result.page || 1,
      totalPages: result.totalPages || 1
    };
  } catch (error) {
    console.error('Error fetching schools:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch schools',
      data: []
    };
  }
};
// Edit community post
export const editCommunityPost = async (postId, formData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_temp_URL}/school/editCommunityPost/${postId}`, {
      method: 'PUT',
      headers: headers,
      body: formData, // FormData object
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Post updated successfully',
      data: result.post || result.data
    };
  } catch (error) {
    console.error('Error editing post:', error);
    return {
      success: false,
      error: error.message || 'Failed to edit post'
    };
  }
};

// Delete community post
export const deleteCommunityPost = async (postId) => {
  try {
    const response = await fetch(`${API_BASE_temp_URL}/school/deleteCommunityPost/${postId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Post deleted successfully',
      data: result
    };
  } catch (error) {
    console.error('Error deleting post:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete post'
    };
  }
};


// Get posts by school ID
export const getPostsBySchool = async (schoolId, page = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/posts-school/${schoolId}?page=${page}`, {
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
      data: result.posts || [],
      schoolId: result.schoolId,
      totalPosts: result.totalPosts || 0,
      page: result.page || 1,
      totalPages: result.totalPages || 1
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

// Get posts by group ID
export const getPostsByGroup = async (groupId, page = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/posts-group/${groupId}?page=${page}`, {
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
      data: result.posts || [],
      groupId: result.groupId,
      totalPosts: result.totalPosts || 0,
      page: result.page || 1,
      totalPages: result.totalPages || 1
    };
  } catch (error) {
    console.error('Error fetching group posts:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch group posts',
      data: []
    };
  }
};

// Get trending posts
export const getTrendingPosts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/trending/dashboard`, {
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
      data: result.trendingPosts || [],
      count: result.count || 0
    };
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch trending posts',
      data: []
    };
  }
};

// Toggle post trending status
export const setPostTrending = async (postId, isTrending) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trending/${postId}/set-trending`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isTrending }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Trending status updated',
      data: result.post
    };
  } catch (error) {
    console.error('Error updating trending status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update trending status'
    };
  }
};