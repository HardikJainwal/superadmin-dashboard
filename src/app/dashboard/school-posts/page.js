'use client'
import React, { useState, useEffect } from 'react';
import { FileText, BarChart3, Image as ImageIcon, X, Plus, Upload, RefreshCw, MessageSquare, Users, CheckCircle2, Send, Building2, Globe } from 'lucide-react';
import { createPost, getCommunityGroups, } from '@/lib/communitypostapi';

const Community = () => {
  const [postType, setPostType] = useState('text');
  const [message, setMessage] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [postScope, setPostScope] = useState('global'); 
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchCommunityGroups();
  }, []);

  const fetchCommunityGroups = async () => {
    setLoadingGroups(true);
    try {
      const result = await getCommunityGroups();
      console.log('Groups fetched:', result);
      if (result.success) {
        setAvailableGroups(result.data || []);
      } else {
        console.error('Error fetching groups:', result.error);
        setErrorMessage(result.error || 'Failed to fetch groups');
        setAvailableGroups([]);
      }
    } catch (error) {
      console.error('Exception fetching groups:', error);
      setErrorMessage('Failed to fetch groups');
      setAvailableGroups([]);
    }
    setLoadingGroups(false);
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    const fileInput = document.getElementById('imageInput');
    if (fileInput) fileInput.value = '';
  };

  const resetForm = () => {
    setMessage('');
    setPollOptions(['', '']);
    setImage(null);
    setImagePreview(null);
    setSelectedGroups([]);
    setPostType('text');
    setSchoolId('');
    setPostScope('global');
    const fileInput = document.getElementById('imageInput');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {

      if (!message.trim()) {
        setErrorMessage('Message is required');
        setLoading(false);
        return;
      }

      if (postScope === 'school' && !schoolId.trim()) {
        setErrorMessage('School ID is required for school-specific posts');
        setLoading(false);
        return;
      }

      if (postType === 'poll') {
        const validOptions = pollOptions.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
          setErrorMessage('Poll must have at least 2 options');
          setLoading(false);
          return;
        }
      }

      if (postType === 'image' && !image) {
        setErrorMessage('Please select an image');
        setLoading(false);
        return;
      }

      const postData = {
        postType,
        message: message.trim(),
        groups: selectedGroups
      };

      if (postScope === 'school' && schoolId.trim()) {
        postData.schoolId = schoolId.trim();
      }

      if (postType === 'poll') {
        postData.pollOptions = pollOptions.filter(opt => opt.trim() !== '');
      }

      if (postType === 'image') {
        postData.image = image;
      }

      console.log('Submitting post:', postData);

      const result = await createPost(postData);
      
      console.log('Post result:', result);

      if (result.success) {
        setSuccessMessage(`Post created successfully! ${postScope === 'school' ? '(Posted to specific school)' : '(Posted globally)'} 🎉`);
        resetForm();
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        setErrorMessage(result.error || 'Failed to create post');
      }

    } catch (error) {
      console.error('Exception creating post:', error);
      setErrorMessage(error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-indigo-600 rounded-xl shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Community Hub
              </h1>
              <p className="text-gray-600 mt-2 font-medium">Create and share posts with your community</p>
            </div>
          </div>
        </div>

        {/* Create Post Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Post</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Post Scope Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Post Scope</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`py-4 px-4 rounded-xl border-2 font-semibold transition-all ${
                    postScope === 'global'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-400'
                  }`}
                  onClick={() => setPostScope('global')}
                >
                  <Globe className={`w-6 h-6 mx-auto mb-2 ${postScope === 'global' ? 'text-white' : 'text-indigo-600'}`} />
                  Global Post
                </button>
                <button
                  type="button"
                  className={`py-4 px-4 rounded-xl border-2 font-semibold transition-all ${
                    postScope === 'school'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-400'
                  }`}
                  onClick={() => setPostScope('school')}
                >
                  <Building2 className={`w-6 h-6 mx-auto mb-2 ${postScope === 'school' ? 'text-white' : 'text-indigo-600'}`} />
                  School Specific
                </button>
              </div>
            </div>

            
            {postScope === 'school' && (
              <div className="mb-6">
                <label htmlFor="schoolId" className="block text-sm font-semibold text-gray-700 mb-3">
                  School ID *
                </label>
                <input
                  type="text"
                  id="schoolId"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  placeholder="Enter School ID (e.g., 68a4117f518700bc75ae09ff)"
                  required={postScope === 'school'}
                />
                <p className="text-xs text-gray-500 mt-2">This post will only be visible to the specified school</p>
              </div>
            )}
            
            {/* Post Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Post Type</label>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { type: 'text', icon: FileText, label: 'Text' },
                  { type: 'poll', icon: BarChart3, label: 'Poll' },
                  { type: 'image', icon: ImageIcon, label: 'Image' }
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    className={`py-4 px-3 sm:px-4 rounded-xl border-2 font-semibold transition-all ${
                      postType === type
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-400'
                    }`}
                    onClick={() => setPostType(type)}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${postType === type ? 'text-white' : 'text-indigo-600'}`} />
                    <span className="text-xs sm:text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-3">
                {postType === 'poll' ? 'Poll Question' : 'Message'} *
              </label>
              <textarea
                id="message"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={postType === 'poll' ? 'What would you like to ask?' : 'Share something...'}
                rows={4}
                required
              />
            </div>
            
            {/* Poll Options */}
            {postType === 'poll' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Poll Options</label>
                <div className="space-y-3 mb-4">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={option}
                        onChange={(e) => handlePollOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
                          onClick={() => removePollOption(index)}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  onClick={addPollOption}
                >
                  <Plus className="w-5 h-5" />
                  Add Option
                </button>
              </div>
            )}

            {/* Image Upload */}
            {postType === 'image' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Image *</label>
                {!imagePreview ? (
                  <div>
                    <input
                      type="file"
                      id="imageInput"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="imageInput"
                      className="block border-2 border-dashed border-gray-300 rounded-xl p-12 sm:p-16 text-center cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition-all"
                    >
                      <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                      <span className="text-gray-700 font-semibold">Click to upload image</span>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border-2 border-gray-300">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-contain bg-gray-100" />
                    <button
                      type="button"
                      className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-lg flex items-center gap-2 font-semibold"
                      onClick={removeImage}
                    >
                      <X className="w-5 h-5" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Groups Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Select Groups (Optional)
              </label>
              {loadingGroups ? (
                <div className="text-gray-500 text-sm py-6 text-center">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-indigo-600" />
                  Loading groups...
                </div>
              ) : (
                <div className="border-2 border-gray-300 rounded-xl p-4 max-h-64 overflow-y-auto bg-gray-50">
                  {availableGroups.length > 0 ? (
                    <div className="space-y-2">
                      {availableGroups.map((group) => (
                        <label key={group._id} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-3 rounded-lg transition-all">
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group._id)}
                            onChange={() => handleGroupToggle(group._id)}
                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-800">{group.name}</span>
                            {group.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{group.description}</p>
                            )}
                            <p className="text-xs text-indigo-600 mt-1 font-medium">{group.membersCount || 0} members</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">No groups available</p>
                  )}
                </div>
              )}
              {selectedGroups.length > 0 && (
                <div className="flex items-center gap-2 mt-3 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700 font-semibold">{selectedGroups.length} group(s) selected</p>
                </div>
              )}
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl flex items-center gap-3">
                <X className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                className="flex-1 sm:flex-none px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Create Post
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Community;