const API_BASE_URL = "http://localhost:3000/api/v1";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const getAuthHeaderForFormData = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Create Challenge API using fetch
export const createChallenge = async (challengeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/create-challenge`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(challengeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create challenge");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating challenge:", error);
    throw error;
  }
};

// Get All Challenges API
export const getAllChallenges = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/challenges`, {
      method: "GET",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch challenges");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching challenges:", error);
    throw error;
  }
};

// Toggle Challenge Active/Inactive Status API
export const toggleChallengeActive = async (challengeId, isActive) => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/challenge/toggle-active/${challengeId}`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to toggle challenge status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error toggling challenge status:", error);
    throw error;
  }
};

// Get Challenge Submissions API
export const getChallengeSubmissions = async (challengeId, page = 1, limit = 10) => {
  try {
    const queryParams = new URLSearchParams({
      challengeId,
      ...(page && { page: page.toString() }),
      ...(limit && { limit: limit.toString() }),
    });

    const response = await fetch(`${API_BASE_URL}/superAdmin/challenge-submissions?${queryParams}`, {
      method: "GET",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch challenge submissions");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching challenge submissions:", error);
    throw error;
  }
};

// Grade Challenge Submission API
export const gradeSubmission = async (submissionId, score, feedback = "") => {
  try {
    const response = await fetch(`${API_BASE_URL}/superAdmin/challenge-grade/${submissionId}`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ score, feedback }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to grade submission");
    }

    return await response.json();
  } catch (error) {
    console.error("Error grading submission:", error);
    throw error;
  }
};

// Update Challenge Days API with files
export const updateChallengeDays = async (challengeId, challengeDaysData, files = [], images = []) => {
  try {
    const formData = new FormData();
    
    // Add challengeDays JSON string
    formData.append('challengeDays', JSON.stringify(challengeDaysData));
    
    // Add files in sequence based on challenge days structure
    // Files should be added in the order they appear in the days
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add images in sequence based on challenge days structure
    // Images should be added in the order they appear in the days
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await fetch(`${API_BASE_URL}/superAdmin/challenge/${challengeId}/days`, {
      method: "PUT",
      headers: getAuthHeaderForFormData(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update challenge days");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating challenge days:", error);
    throw error;
  }
};

// Helper function to organize files for updateChallengeDays
// This ensures files are in the correct sequence matching the challenge days
export const organizeFilesForUpload = (challengeDays, fileInputs) => {
  const images = [];
  const files = [];
  
  // Iterate through days in order
  challengeDays.forEach((day, dayIndex) => {
    day.content.forEach((contentItem, contentIndex) => {
      if (contentItem.type === 'image' && fileInputs.images?.[dayIndex]?.[contentIndex]) {
        images.push(fileInputs.images[dayIndex][contentIndex]);
      } else if (contentItem.type === 'pdf' && fileInputs.files?.[dayIndex]?.[contentIndex]) {
        files.push(fileInputs.files[dayIndex][contentIndex]);
      }
    });
  });
  
  return { images, files };
};