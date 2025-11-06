const API_BASE_URL = 'http://localhost:3000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
};


const createProgram = async (programData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/program`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(programData),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Failed to create program' };
    }
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export { createProgram };