'use client'
import { useState, useEffect } from 'react';
import { 
  createChallenge, 
  getAllChallenges, 
  toggleChallengeActive,
  getChallengeSubmissions 
} from '@/lib/activeChallengeapi';
import { useRouter } from 'next/navigation';

export default function CreateChallenge() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    daysCount: '',
    totalPoints: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [togglingChallengeId, setTogglingChallengeId] = useState(null);

  // Fetch challenges
  const fetchChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const response = await getAllChallenges();
      setChallenges(response.challenges || []);
    } catch (err) {
      console.error('Error fetching challenges:', err);
    } finally {
      setLoadingChallenges(false);
    }
  };

  useEffect(() => {
    // Fetch challenges on component mount
    fetchChallenges();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await createChallenge(formData);
      setSuccess('Challenge created successfully!');
      setFormData({
        title: '',
        description: '',
        startDate: '',
        daysCount: '',
        totalPoints: ''
      });
      // Refresh challenges list
      fetchChallenges();
    } catch (err) {
      setError(err.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeClick = (challengeId) => {
    // Navigate to update challenge days page with challenge ID
    router.push(`/dashboard/active-challange/${challengeId}/days`);
  };

  const handleToggleActive = async (e, challengeId, currentStatus) => {
    e.stopPropagation(); // Prevent card click event
    setTogglingChallengeId(challengeId);
    
    try {
      await toggleChallengeActive(challengeId, !currentStatus);
      setSuccess(`Challenge ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      // Refresh challenges list to show updated status
      fetchChallenges();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to toggle challenge status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setTogglingChallengeId(null);
    }
  };

  const handleViewSubmissions = (e, challengeId) => {
    e.stopPropagation(); // Prevent card click event
    // Navigate to submissions page
    router.push(`/dashboard/active-challange/${challengeId}/submissions`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Challenge Form */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Create Challenge</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Days Count
              </label>
              <input
                type="number"
                name="daysCount"
                value={formData.daysCount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Total Points
              </label>
              <input
                type="number"
                name="totalPoints"
                value={formData.totalPoints}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Challenge'}
            </button>
          </form>
        </div>

        {/* Challenges List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Active Challenges</h2>
            <button
              onClick={() => setShowChallenges(!showChallenges)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showChallenges ? 'Hide' : 'Show'} Challenges
            </button>
          </div>

          {showChallenges && (
            <div>
              {loadingChallenges ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading challenges...</p>
                </div>
              ) : challenges.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No challenges found</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {challenges.map((challenge) => (
                    <div
                      key={challenge._id}
                      onClick={() => handleChallengeClick(challenge._id)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{challenge.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          challenge.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : challenge.isActive 
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {challenge.status || (challenge.isActive ? 'Active' : 'Inactive')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Days:</span>
                          <span className="ml-1 font-medium">{challenge.daysCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Points:</span>
                          <span className="ml-1 font-medium">{challenge.totalPoints}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Start:</span>
                          <span className="ml-1 font-medium">
                            {new Date(challenge.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">End:</span>
                          <span className="ml-1 font-medium">
                            {new Date(challenge.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={(e) => handleToggleActive(e, challenge._id, challenge.isActive)}
                          disabled={togglingChallengeId === challenge._id}
                          className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                            challenge.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {togglingChallengeId === challenge._id ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            </span>
                          ) : (
                            challenge.isActive ? 'Deactivate' : 'Activate'
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => handleViewSubmissions(e, challenge._id)}
                          className="flex-1 px-3 py-2 text-sm font-medium rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                        >
                          View Submissions
                        </button>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-xs text-blue-600 font-medium">
                          Click card to update challenge days →
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}