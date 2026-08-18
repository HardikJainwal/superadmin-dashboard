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
    throw new Error(errorData.message || `Failed to create event (${response.status})`);
  }

  return response.json();
};

export const EventService = {
  createEvent,
};
