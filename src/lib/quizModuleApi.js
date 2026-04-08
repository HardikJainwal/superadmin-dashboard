const QUIZ_API_BASE = 'http://localhost:3000/api/v1/quiz/modules';

export async function createQuizModule(token, moduleData) {
  const response = await fetch(QUIZ_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(moduleData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to create quiz module (${response.status})`);
  }

  return data;
}

export async function getQuizModules(token) {
  const response = await fetch(QUIZ_API_BASE, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch quiz modules (${response.status})`);
  }

  return data;
}

export async function deleteQuizModule(token, moduleId) {
  const response = await fetch(`${QUIZ_API_BASE}/${moduleId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to delete quiz module (${response.status})`);
  }

  return data;
}
