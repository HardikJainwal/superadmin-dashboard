'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateChallengeDays, getAllChallenges } from '@/lib/activeChallengeapi';

export default function UpdateChallengeDays() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id;

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [challengeDays, setChallengeDays] = useState([]);
  const [fileInputs, setFileInputs] = useState({});

  useEffect(() => {
    fetchChallengeDetails();
  }, [challengeId]);

  const fetchChallengeDetails = async () => {
    try {
      const response = await getAllChallenges();
      const foundChallenge = response.challenges?.find(c => c._id === challengeId);
      
      if (foundChallenge) {
        setChallenge(foundChallenge);
        // Initialize challenge days structure
        const days = Array.from({ length: foundChallenge.daysCount }, (_, i) => ({
          dayNumber: i + 1,
          title: `Day ${i + 1}`,
          content: []
        }));
        setChallengeDays(days);
      } else {
        setError('Challenge not found');
      }
    } catch (err) {
      setError('Failed to fetch challenge details');
    } finally {
      setLoading(false);
    }
  };

  const handleDayTitleChange = (dayIndex, value) => {
    const updated = [...challengeDays];
    updated[dayIndex].title = value;
    setChallengeDays(updated);
  };

  const addContent = (dayIndex, type) => {
    const updated = [...challengeDays];
    updated[dayIndex].content.push({ type, value: '' });
    setChallengeDays(updated);
  };

  const removeContent = (dayIndex, contentIndex) => {
    const updated = [...challengeDays];
    updated[dayIndex].content.splice(contentIndex, 1);
    setChallengeDays(updated);
    
    // Also remove associated file if exists
    const key = `${dayIndex}-${contentIndex}`;
    const newFileInputs = { ...fileInputs };
    delete newFileInputs[key];
    setFileInputs(newFileInputs);
  };

  const handleTextContentChange = (dayIndex, contentIndex, value) => {
    const updated = [...challengeDays];
    updated[dayIndex].content[contentIndex].value = value;
    setChallengeDays(updated);
  };

  const handleFileChange = (dayIndex, contentIndex, file) => {
    const key = `${dayIndex}-${contentIndex}`;
    setFileInputs(prev => ({
      ...prev,
      [key]: file
    }));
  };

  const organizeFilesForUpload = () => {
    const images = [];
    const files = [];
    
    challengeDays.forEach((day, dayIndex) => {
      day.content.forEach((contentItem, contentIndex) => {
        const key = `${dayIndex}-${contentIndex}`;
        const file = fileInputs[key];
        
        if (contentItem.type === 'image' && file) {
          images.push(file);
        } else if (contentItem.type === 'pdf' && file) {
          files.push(file);
        }
      });
    });
    
    return { images, files };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validate that all file/image content has files uploaded
      for (let dayIndex = 0; dayIndex < challengeDays.length; dayIndex++) {
        const day = challengeDays[dayIndex];
        for (let contentIndex = 0; contentIndex < day.content.length; contentIndex++) {
          const content = day.content[contentIndex];
          const key = `${dayIndex}-${contentIndex}`;
          
          if ((content.type === 'image' || content.type === 'pdf') && !fileInputs[key]) {
            throw new Error(`Please upload ${content.type} for Day ${day.dayNumber}, Item ${contentIndex + 1}`);
          }
        }
      }

      const { images, files } = organizeFilesForUpload();
      
      await updateChallengeDays(challengeId, challengeDays, files, images);
      
      setSuccess('Challenge days updated successfully!');
      setTimeout(() => {
        router.push('/dashboard/active-challange');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update challenge days');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          Challenge not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Challenges
        </button>
        <h1 className="text-3xl font-bold mb-2">{challenge.title}</h1>
        <p className="text-gray-600">{challenge.description}</p>
        <div className="mt-2 text-sm text-gray-500">
          {challenge.daysCount} days • {challenge.totalPoints} points
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {challengeDays.map((day, dayIndex) => (
          <div key={dayIndex} className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Day {day.dayNumber}</h2>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Day Title
              </label>
              <input
                type="text"
                value={day.title}
                onChange={(e) => handleDayTitleChange(dayIndex, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Content</label>
              
              {day.content.map((content, contentIndex) => (
                <div key={contentIndex} className="flex gap-2 items-start bg-gray-50 p-3 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-600 uppercase">
                        {content.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeContent(dayIndex, contentIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {content.type === 'text' ? (
                      <textarea
                        value={content.value}
                        onChange={(e) => handleTextContentChange(dayIndex, contentIndex, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Enter text content"
                        required
                      />
                    ) : content.type === 'image' ? (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(dayIndex, contentIndex, e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {fileInputs[`${dayIndex}-${contentIndex}`] && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ {fileInputs[`${dayIndex}-${contentIndex}`].name}
                          </p>
                        )}
                      </div>
                    ) : content.type === 'pdf' ? (
                      <div>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(dayIndex, contentIndex, e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {fileInputs[`${dayIndex}-${contentIndex}`] && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ {fileInputs[`${dayIndex}-${contentIndex}`].name}
                          </p>
                        )}
                      </div>
                    ) : content.type === 'video' ? (
                      <input
                        type="url"
                        value={content.value}
                        onChange={(e) => handleTextContentChange(dayIndex, contentIndex, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter video URL (YouTube, etc.)"
                        required
                      />
                    ) : null}
                  </div>
                </div>
              ))}

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => addContent(dayIndex, 'text')}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  + Text
                </button>
                <button
                  type="button"
                  onClick={() => addContent(dayIndex, 'image')}
                  className="px-3 py-1 text-sm bg-blue-200 hover:bg-blue-300 rounded"
                >
                  + Image
                </button>
                <button
                  type="button"
                  onClick={() => addContent(dayIndex, 'pdf')}
                  className="px-3 py-1 text-sm bg-red-200 hover:bg-red-300 rounded"
                >
                  + PDF
                </button>
                <button
                  type="button"
                  onClick={() => addContent(dayIndex, 'video')}
                  className="px-3 py-1 text-sm bg-purple-200 hover:bg-purple-300 rounded"
                >
                  + Video
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
        >
          {submitting ? 'Submitting...' : 'Submit Challenge Days'}
        </button>
      </form>
    </div>
  );
}