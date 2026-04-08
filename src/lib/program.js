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


export { createProgram };