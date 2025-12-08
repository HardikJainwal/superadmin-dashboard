'use client'
import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3000/api/v1';


const getAuthHeader = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});


const getAllSchools = async (token) => {
  try {
    let allSchools = [];
    let currentPage = 1;
    let totalPages = 1;


    while (currentPage <= totalPages) {
      const response = await fetch(`${API_BASE_URL}/superAdmin/schools?page=${currentPage}&limit=100`, {
        method: 'GET',
        headers: getAuthHeader(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      allSchools = [...allSchools, ...(result.schools || [])];
      totalPages = result.totalPages || 1;
      currentPage++;
    }

    return {
      success: true,
      data: allSchools,
      total: allSchools.length
    };
  } catch (error) {
    console.error('Error fetching schools:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch schools',
      data: []
    };
  }
};

const getAllCoaches = async (token) => {
  try {
    let allCoaches = [];
    let currentPage = 1;
    let totalPages = 1;

    // Fetch all pages
    while (currentPage <= totalPages) {
      const response = await fetch(`${API_BASE_URL}/superAdmin/coaches/?page=${currentPage}&limit=100`, {
        method: 'GET',
        headers: getAuthHeader(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      allCoaches = [...allCoaches, ...(result.results || [])];
      totalPages = result.totalPages || 1;
      currentPage++;
    }

    return {
      success: true,
      data: allCoaches,
      total: allCoaches.length
    };
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch coaches',
      data: []
    };
  }
};

const updateCoachTimings = async (schoolId, coachTimings) => {
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

const getSessions = async (schoolId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/coaches/session/${schoolId}`, {
      method: 'GET',
      headers: getAuthHeader(token),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return { success: false, error: error.message };
  }
};

const rejectSession = async (sessionId, reassignCoach, newCoachId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/coaches/rejectSession/${sessionId}`, {
      method: 'POST',
      headers: getAuthHeader(token),
      body: JSON.stringify({
        reassignCoach,
        newCoachId: reassignCoach ? newCoachId : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error rejecting session:', error);
    return { success: false, error: error.message };
  }
};

const CoachSessionManager = () => {
  const [activeTab, setActiveTab] = useState('timings');
  const [schoolId, setSchoolId] = useState('');
  const [authToken, setAuthToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  });
  
  const [schools, setSchools] = useState([]);
  const [allCoaches, setAllCoaches] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [coaches, setCoaches] = useState([
    { coachId: '', defaultStartTime: '16:00', defaultEndTime: '17:00' }
  ]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [reassignCoach, setReassignCoach] = useState(false);
  const [newCoachId, setNewCoachId] = useState('');

  // Fetch schools and coaches on mount
  useEffect(() => {
    if (authToken) {
      fetchInitialData();
    }
  }, [authToken]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    await Promise.all([fetchSchools(), fetchCoaches()]);
    setLoadingData(false);
  };

  const fetchSchools = async () => {
    const result = await getAllSchools(authToken);
    if (result.success) {
      setSchools(result.data);
      if (result.data.length > 0 && !schoolId) {
        setSchoolId(result.data[0]._id);
      }
    } else {
      setMessage(`Error fetching schools: ${result.error}`);
    }
  };

  const fetchCoaches = async () => {
    const result = await getAllCoaches(authToken);
    if (result.success) {
      setAllCoaches(result.data);
    } else {
      setMessage(`Error fetching coaches: ${result.error}`);
    }
  };

  const handleCoachChange = (index, field, value) => {
    const updatedCoaches = [...coaches];
    updatedCoaches[index][field] = value;
    setCoaches(updatedCoaches);
  };

  const addCoach = () => {
    setCoaches([
      ...coaches,
      { coachId: '', defaultStartTime: '', defaultEndTime: '' }
    ]);
  };

  const removeCoach = (index) => {
    const updatedCoaches = coaches.filter((_, i) => i !== index);
    setCoaches(updatedCoaches);
  };

  const handleSubmitTimings = async () => {
    setLoading(true);
    setMessage('');

    const result = await updateCoachTimings(schoolId, coaches);

    if (result.success) {
      setMessage('Coach timings updated successfully!');
    } else {
      setMessage(`Error: ${result.error}`);
    }

    setLoading(false);
  };

  const fetchSessions = async () => {
    if (!authToken) {
      setMessage('Error: Please enter an authorization token');
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await getSessions(schoolId, authToken);

    if (result.success) {
      setSessions(result.data.sessions || result.data || []);
      setMessage('Sessions loaded successfully!');
    } else {
      setMessage(`Error: ${result.error}`);
    }

    setLoading(false);
  };

  const handleRejectSession = async (sessionId) => {
    if (!authToken) {
      setMessage('Error: Please enter an authorization token');
      return;
    }

    if (reassignCoach && !newCoachId) {
      setMessage('Error: Please select a new coach for reassignment');
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await rejectSession(sessionId, reassignCoach, newCoachId, authToken);

    if (result.success) {
      setMessage('Session rejected successfully!');
      setSelectedSession(null);
      setReassignCoach(false);
      setNewCoachId('');
      fetchSessions();
    } else {
      setMessage(`Error: ${result.error}`);
    }

    setLoading(false);
  };

  const getCoachName = (coachId) => {
    const coach = allCoaches.find(c => c._id === coachId);
    return coach ? coach.coachName : 'Unknown Coach';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Coach Management System</h1>
      
      {/* Loading Indicator for Initial Data */}
      {loadingData && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200 text-center">
          <p className="text-blue-700 font-medium">Loading schools and coaches...</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('timings')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'timings'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Update Timings
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'sessions'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manage Sessions
        </button>
      </div>

      {/* School Selection */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">
          Select School {schools.length > 0 && `(${schools.length} schools available)`}
        </label>
        <select
          id="schoolId"
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          disabled={loadingData || schools.length === 0}
        >
          <option value="">Select a school</option>
          {schools.map((school) => (
            <option key={school._id} value={school._id}>
              {school.schoolName || school.name || school._id}
            </option>
          ))}
        </select>
      </div>

      {/* Update Timings Tab */}
      {activeTab === 'timings' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Coach Timings</h3>
            
            <div className="space-y-4">
              {coaches.map((coach, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Coach {allCoaches.length > 0 && `(${allCoaches.length} coaches available)`}
                      </label>
                      <select
                        value={coach.coachId}
                        onChange={(e) => handleCoachChange(index, 'coachId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                        disabled={loadingData}
                      >
                        <option value="">Select a coach</option>
                        {allCoaches.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.coachName} - {c.specialization}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={coach.defaultStartTime}
                        onChange={(e) => handleCoachChange(index, 'defaultStartTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={coach.defaultEndTime}
                        onChange={(e) => handleCoachChange(index, 'defaultEndTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>
                  
                  {coaches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCoach(index)}
                      className="mt-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 text-sm font-medium"
                    >
                      Remove Coach
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addCoach}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 font-medium"
            >
              + Add Coach
            </button>
          </div>

          <button
            onClick={handleSubmitTimings}
            disabled={loading || !schoolId}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 font-semibold text-lg"
          >
            {loading ? 'Updating...' : 'Update Timings'}
          </button>
        </div>
      )}

      {/* Manage Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <button
            onClick={fetchSessions}
            disabled={loading || !authToken || !schoolId}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 font-semibold"
          >
            {loading ? 'Loading...' : 'Load Sessions'}
          </button>

          {sessions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Sessions ({sessions.length})</h3>
              {sessions.map((session) => (
                <div key={session.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Session ID</p>
                      <p className="font-medium text-gray-800 text-xs break-all">{session.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coach Type</p>
                      <p className="font-medium text-gray-800">{session.coachType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coach Name</p>
                      <p className="font-medium text-gray-800">{session.coach?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coach ID</p>
                      <p className="font-medium text-gray-800 text-xs">{session.coach?.id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Specialization</p>
                      <p className="font-medium text-gray-800">{session.coach?.specialization || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`font-medium inline-block px-2 py-1 rounded text-sm ${
                        session.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                        session.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-medium text-gray-800">
                        {new Date(session.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium text-gray-800">
                        {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  
                  {session.coachLink && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">Coach Link</p>
                      <a 
                        href={session.coachLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs break-all underline"
                      >
                        {session.coachLink}
                      </a>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setSelectedSession(session.id)}
                    disabled={session.status === 'rejected'}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 text-sm font-medium"
                  >
                    {session.status === 'rejected' ? 'Already Rejected' : 'Reject Session'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Reject Session Modal */}
          {selectedSession && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Reject Session</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reassign"
                      checked={reassignCoach}
                      onChange={(e) => setReassignCoach(e.target.checked)}
                      className="mr-2 w-4 h-4"
                    />
                    <label htmlFor="reassign" className="text-sm font-medium text-gray-700">
                      Reassign to another coach
                    </label>
                  </div>

                  {reassignCoach && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select New Coach
                      </label>
                      <select
                        value={newCoachId}
                        onChange={(e) => setNewCoachId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select a coach</option>
                        {allCoaches.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.coachName} - {c.specialization}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setSelectedSession(null);
                        setReassignCoach(false);
                        setNewCoachId('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRejectSession(selectedSession)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 font-medium"
                    >
                      {loading ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mt-6 p-4 rounded-lg font-medium ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-800 border border-red-300' 
            : 'bg-green-100 text-green-800 border border-green-300'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default CoachSessionManager;