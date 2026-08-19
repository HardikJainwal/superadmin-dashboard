const API_BASE_URL = process.env.NEXT_PUBLIC_C_BACKEND_URL || 'https://api.humanova.live/api/v1';

export const createEvent = async (formData) => {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('corporate_token') || localStorage.getItem('token') || ''
      : '';

  const response = await fetch(`${API_BASE_URL}/school/createEvent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg =
      errorData.message ||
      errorData.error ||
      errorData.msg ||
      (typeof errorData.details === 'string' ? errorData.details : null) ||
      `Failed to create event (${response.status})`;
    throw new Error(errMsg);
  }

  return response.json();
};

export const EventService = {
  createEvent,
};
