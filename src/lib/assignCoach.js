const API_BASE_URL = 'http://localhost:3000/api/v1';


export const updateCoachTimings = async (schoolId, coachTimings) => {
  try {
    const response = await fetch(`${API_BASE_URL}/coaches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolId,
        coachTimings,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating coach timings:', error);
    return { success: false, error: error.message };
  }
};

export const formatCoachTimings = (coaches) => {
  return coaches.map(coach => ({
    coachId: coach.id,
    defaultStartTime: coach.startTime,
    defaultEndTime: coach.endTime,
  }));
};