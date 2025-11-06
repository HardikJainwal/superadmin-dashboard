'use client'
import { useState, useEffect } from 'react';
import { getChallengeSubmissions, gradeSubmission } from '@/lib/activeChallengeapi';
import { useParams, useRouter } from 'next/navigation';

export default function ChallengeSubmissions() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id;

  const [loading, setLoading] = useState(true);
  const [submissionsData, setSubmissionsData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeForm, setGradeForm] = useState({});

  // Fetch submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getChallengeSubmissions(challengeId);
      setSubmissionsData(response);
    } catch (err) {
      setError(err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (challengeId) {
      fetchSubmissions();
    }
  }, [challengeId]);

  const handleGradeChange = (submissionId, field, value) => {
    setGradeForm(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const handleGradeSubmission = async (submissionId) => {
    const gradeData = gradeForm[submissionId];
    if (!gradeData?.score && gradeData?.score !== 0) {
      setError('Please enter a score');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const maxPerDay = submissionsData?.challenge?.maxPerDay || 10;
    if (gradeData.score > maxPerDay || gradeData.score < 0) {
      setError(`Score must be between 0 and ${maxPerDay}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setGradingSubmissionId(submissionId);
    try {
      await gradeSubmission(
        submissionId, 
        Number(gradeData.score), 
        gradeData.feedback || ''
      );
      setSuccess('Submission graded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Clear the form for this submission
      setGradeForm(prev => {
        const newForm = { ...prev };
        delete newForm[submissionId];
        return newForm;
      });
      
      // Refresh submissions
      fetchSubmissions();
    } catch (err) {
      setError(err.message || 'Failed to grade submission');
      setTimeout(() => setError(''), 3000);
    } finally {
      setGradingSubmissionId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error && !submissionsData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const { challenge, submissions = [], total } = submissionsData || {};

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          <span className="mr-2">←</span> Back to Challenges
        </button>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-2">{challenge?.title}</h1>
          <p className="text-gray-600 mb-4">{challenge?.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Days:</span>
              <span className="ml-2 font-semibold">{challenge?.daysCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Points:</span>
              <span className="ml-2 font-semibold">{challenge?.totalPoints}</span>
            </div>
            <div>
              <span className="text-gray-500">Max Per Day:</span>
              <span className="ml-2 font-semibold">{challenge?.maxPerDay}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Submissions:</span>
              <span className="ml-2 font-semibold">{total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
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

      {/* Submissions List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Submissions ({total})</h2>
        
        {submissions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No submissions yet</p>
          </div>
        ) : (
          submissions.map((submission) => (
            <div
              key={submission._id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              {/* Submission Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    Day {submission.dayNumber} Submission
                  </h3>
                  <p className="text-sm text-gray-600">
                    {submission.studentId?.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    School: {submission.schoolId?.name}
                  </p>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  submission.status === 'graded'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {submission.status}
                </span>
              </div>

              {/* Submission Link */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Submission Link:</p>
                {submission.submissionLink.startsWith('http') ? (
                  <a
                    href={submission.submissionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {submission.submissionLink}
                  </a>
                ) : (
                  <p className="text-gray-800 break-all">{submission.submissionLink}</p>
                )}
              </div>

              {/* Grading Section */}
              {submission.status === 'graded' ? (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Score:</p>
                      <p className="text-2xl font-bold text-green-600">
                        {submission.score} / {challenge?.maxPerDay}
                      </p>
                    </div>
                    {submission.feedback && (
                      <div>
                        <p className="text-sm text-gray-600">Feedback:</p>
                        <p className="text-gray-800">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Graded on: {new Date(submission.updatedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Grade Submission</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Score (0 - {challenge?.maxPerDay})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={challenge?.maxPerDay}
                        value={gradeForm[submission._id]?.score || ''}
                        onChange={(e) => handleGradeChange(submission._id, 'score', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter score"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Feedback (Optional)
                      </label>
                      <input
                        type="text"
                        value={gradeForm[submission._id]?.feedback || ''}
                        onChange={(e) => handleGradeChange(submission._id, 'feedback', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter feedback"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleGradeSubmission(submission._id)}
                    disabled={gradingSubmissionId === submission._id}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {gradingSubmissionId === submission._id ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Grading...
                      </span>
                    ) : (
                      'Submit Grade'
                    )}
                  </button>
                </div>
              )}

              {/* Submission Dates */}
              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                <span>Submitted: {new Date(submission.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}