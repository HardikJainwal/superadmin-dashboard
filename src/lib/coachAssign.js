const API_BASE_URL = "http://localhost:3000/api/v1/";

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
};

export const getAllSchools = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/schools`, {
      method: 'GET',
      headers: getAuthHeader(),
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




