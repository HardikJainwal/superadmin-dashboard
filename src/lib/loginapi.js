const API_BASE_URL = 'http://69.62.74.102:3000/api/v1/superAdmin';

export const sendOTP = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Failed to send OTP' };
    }
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: parseInt(otp) }),
    });

    const data = await response.json();

    if (response.ok) {
      return { 
        success: true, 
        data: {
          token: data.token,
          role: data.role,
          user: data.superAdmin
        }
      };
    } else {
      return { success: false, error: data.message || 'Invalid OTP' };
    }
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};