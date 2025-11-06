export const API_BASE_URL = "http://localhost:3000/api/v1";

export const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};



export const createTip = async (text, date) => {
  try {
    const headers = getHeaders();

  
    const today = new Date().toISOString().split("T")[0];
    const body = { text };
    if (date && date > today) {
      body.date = date;
    }

    const response = await fetch(`${API_BASE_URL}/tip`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Tip created successfully",
      data: result.data || result.tip,
    };
  } catch (error) {
    console.error("Error creating tip:", error);
    return { success: false, error: error.message || "Failed to create tip" };
  }
};


export const getAllTips = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tip/admin`, {
      method: "GET",
      headers: getHeaders(),
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Parsed API response:", result);

    // ✅ Correct property name: 'results'
    const tipsData = result.results || result.tips || result.data || [];
    const countData = result.total || result.count || tipsData.length;

    console.log("🧮 Extracted tips:", tipsData);
    console.log("📊 Tips count:", countData);

    return {
      success: true,
      data: tipsData,
      count: countData,
    };
  } catch (error) {
    console.error("❌ Error fetching tips:", error);
    return { success: false, error: error.message || "Failed to fetch tips", data: [] };
  }
};



export const updateTip = async (tipId, text, date) => {
  try {
    const headers = getHeaders();
    const today = new Date().toISOString().split("T")[0];

    const body = { text };
    if (date && date > today) {
      body.date = date;
    }

    const response = await fetch(`${API_BASE_URL}/tip/${tipId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Tip updated successfully",
      data: result.data || result.tip,
    };
  } catch (error) {
    console.error("Error updating tip:", error);
    return { success: false, error: error.message || "Failed to update tip" };
  }
};

export const deleteTip = async (tipId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tip/${tipId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Tip deleted successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error deleting tip:", error);
    return { success: false, error: error.message || "Failed to delete tip" };
  }
};
