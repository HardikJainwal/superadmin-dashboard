import { BACKEND_CONFIG } from "./auth-manager";

export const sendOTP = async (email, backend) => {
  try {
    const config = BACKEND_CONFIG[backend];
    const apiUrl = `${config.url}${config.apiPath}/login`;
    
    const response = await fetch(apiUrl, {
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

export const verifyOTP = async (email, otp, backend) => {
  try {
    const config = BACKEND_CONFIG[backend];
    const apiUrl = `${config.url}${config.apiPath}/verify-otp`;
    
    const response = await fetch(apiUrl, {
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