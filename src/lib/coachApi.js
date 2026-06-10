const COACH_API_BASE = 'https://api.devdoot.org/v1/api/coach-info';

/**
 * Fetch all coaches.
 * @param {'all'|'verified'|'unverified'} type - Filter type
 * @param {string} token - x-access-token for authentication
 */
export async function fetchCoaches(type = 'all', token) {
  const url = `${COACH_API_BASE}/search?type=${type}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'x-access-token': token,
    },
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch coaches');
  return data;
}
