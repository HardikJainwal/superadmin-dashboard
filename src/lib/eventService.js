const API_BASE_URL = process.env.NEXT_PUBLIC_C_BACKEND_URL || 'https://api.humanova.live/api/v1';
// TODO: Switch back to API_BASE_URL once event endpoints are deployed to production
const EVENT_API_BASE = 'http://192.168.29.196:3000/api/v1';

const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('corporate_token') ||
    localStorage.getItem('token') ||
    ''
  );
};

const handleErrorResponse = async (response, fallbackMsg) => {
  const errorData = await response.json().catch(() => ({}));
  const errMsg =
    errorData.message ||
    errorData.error ||
    errorData.msg ||
    (typeof errorData.details === 'string' ? errorData.details : null) ||
    `${fallbackMsg} (${response.status})`;
  throw new Error(errMsg);
};

export const createEvent = async (formData) => {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/school/createEvent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to create event');
  }

  return response.json();
};

export const getEvents = async (schoolId) => {
  const token = getAuthToken();

  let url = `${EVENT_API_BASE}/School/getEvents`;
  if (schoolId) {
    url += `?schoolId=${schoolId}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'schoolid': schoolId || '',
      'ngrok-skip-browser-warning': 'true',
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to fetch events');
  }

  return response.json();
};

export const updateEvent = async (eventId, formData) => {
  const token = getAuthToken();

  const response = await fetch(`${EVENT_API_BASE}/School/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to update event');
  }

  return response.json();
};

export const deleteEvent = async (eventId) => {
  const token = getAuthToken();

  const response = await fetch(`${EVENT_API_BASE}/School/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to delete event');
  }

  return response.json();
};

export const EventService = {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
};
