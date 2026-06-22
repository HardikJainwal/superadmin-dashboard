const API_BASE_URL = 'https://schoolapi.devdoot.org/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('school_token');

  if (!token) {
    console.error('school_token not found in localStorage');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};


const getAllSchools = async () => {
  try {
    let allSchools = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
      const response = await fetch(`${API_BASE_URL}/superAdmin/schools?page=${currentPage}&limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch schools (${response.status})`);
      }

      const result = await response.json();
      allSchools = [...allSchools, ...(result.schools || result.data || [])];
      totalPages = result.totalPages || 1;
      currentPage++;
    }

    return { success: true, data: allSchools, total: allSchools.length };
  } catch (error) {
    console.error('Error fetching schools:', error);
    return { success: false, error: error.message || 'Failed to fetch schools', data: [] };
  }
};


const createProgram = async (programData) => {

  try {
    console.log('📤 Sending payload:', programData);

    const response = await fetch(`${API_BASE_URL}/superAdmin/program`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(programData),
    });

    const data = await response.json();
    console.log('API response:', data);

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Failed to create program' };
    }
  } catch (err) {
    console.error('Fetch error:', err);
    return { success: false, error: err.message };
  }
};


export { createProgram, getAllSchools };