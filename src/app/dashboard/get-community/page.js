'use client'
import React, { useState, useEffect } from 'react';
import { School, Users, FileText, BarChart3, Image as ImageIcon, Calendar, TrendingUp, Eye, Filter, ChevronRight, Building2, Flame, ToggleLeft, ToggleRight, AlertCircle, Sparkles, Edit, Trash2, X, Save } from 'lucide-react';
import { getAllSchools, getPostsBySchool, getPostsByGroup, getTrendingPosts, setPostTrending, editCommunityPost, deleteCommunityPost } from '@/lib/getcommunityapi';
import { getCommunityGroups } from '@/lib/communitypostapi';
import { uploadSchoolLogo, updateSchoolLogo } from '@/lib/communitypostapi';

const ViewPosts = () => {
  const [viewMode, setViewMode] = useState('schools'); 
  const [logoFile, setLogoFile] = useState(null);
const [uploadingLogo, setUploadingLogo] = useState(false);
  const [schools, setSchools] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [togglingTrending, setTogglingTrending] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Edit/Delete states
  const [editingPost, setEditingPost] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [deletingPost, setDeletingPost] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchSchools();
    fetchGroups();
  }, []);

  useEffect(() => {
    if (viewMode === 'trending') {
      fetchTrendingPosts();
    }
  }, [viewMode]);

  const fetchSchools = async () => {
    setLoadingSchools(true);
    const result = await getAllSchools();
    if (result.success) {
      setSchools(result.data);
    }
    setLoadingSchools(false);
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    const result = await getCommunityGroups();
    if (result.success) {
      setGroups(result.data);
    }
    setLoadingGroups(false);
  };

  const fetchTrendingPosts = async () => {
    setLoadingTrending(true);
    const result = await getTrendingPosts();
    if (result.success) {
      setTrendingPosts(result.data);
    }
    setLoadingTrending(false);
  };

  const handleSchoolClick = async (school) => {
    setSelectedSchool(school);
    setSelectedGroup(null);
    setLoading(true);
    const result = await getPostsBySchool(school._id);
    if (result.success) {
      setPosts(result.data);
    }
    setLoading(false);
  };

  const handleGroupClick = async (group) => {
    setSelectedGroup(group);
    setSelectedSchool(null);
    setLoading(true);
    const result = await getPostsByGroup(group._id);
    if (result.success) {
      setPosts(result.data);
    }
    setLoading(false);
  };

  const handleToggleTrending = async (postId, currentStatus) => {
    setTogglingTrending(prev => ({ ...prev, [postId]: true }));
    const result = await setPostTrending(postId, !currentStatus);
    
    if (result.success) {
      setSuccessMessage(`Post trending status updated successfully!`);
      if (viewMode === 'trending') {
        fetchTrendingPosts();
      } else {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { ...post, isTrending: !currentStatus, manuallyTrending: { ...post.manuallyTrending, isSet: !currentStatus } }
              : post
          )
        );
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.error || 'Failed to update trending status');
      setTimeout(() => setErrorMessage(''), 3000);
    }
    
    setTogglingTrending(prev => ({ ...prev, [postId]: false }));
  };

  // Edit Post Functions
  const handleEditClick = (post) => {
    setEditingPost(post._id);
    setEditMessage(post.message || '');
    setEditImages(post.images || []);
    setNewImages([]);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditMessage('');
    setEditImages([]);
    setNewImages([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
  };

  const handleRemoveExistingImage = (index) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async (postId) => {
    if (!editMessage.trim()) {
      setErrorMessage('Post message cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSavingEdit(true);
    const formData = new FormData();
    formData.append('message', editMessage);
    
    // Add existing images that weren't removed
    editImages.forEach((img) => {
      formData.append('existingImages', img);
    });
    
    // Add new images
    newImages.forEach((file) => {
      formData.append('images', file);
    });

    const result = await editCommunityPost(postId, formData);
    
    if (result.success) {
      setSuccessMessage('Post updated successfully!');
      
      // Update the post in the list
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, message: editMessage, images: result.data.images || editImages }
            : post
        )
      );
      
      if (viewMode === 'trending') {
        setTrendingPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { ...post, message: editMessage, images: result.data.images || editImages }
              : post
          )
        );
      }
      
      handleCancelEdit();
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.error || 'Failed to update post');
      setTimeout(() => setErrorMessage(''), 3000);
    }
    
    setSavingEdit(false);
  };

  // Delete Post Functions
  const handleDeleteClick = (postId) => {
    setDeletingPost(postId);
  };

  const handleCancelDelete = () => {
    setDeletingPost(null);
  };

  const handleConfirmDelete = async (postId) => {
    const result = await deleteCommunityPost(postId);
    
    if (result.success) {
      setSuccessMessage('Post deleted successfully!');
      
      // Remove post from the list
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      
      if (viewMode === 'trending') {
        setTrendingPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.error || 'Failed to delete post');
      setTimeout(() => setErrorMessage(''), 3000);
    }
    
    setDeletingPost(null);
  };

  const getReactionIcon = (reaction) => {
    switch (reaction) {
      case 'love': return '❤️';
      case 'laughing': return '😂';
      case 'sad': return '😢';
      case 'like': return '👍';
      default: return '👍';
    }
  };
  const handleLogoChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setLogoFile(file);
  }
};

const handleUploadLogo = async () => {
  if (!logoFile) {
    setErrorMessage('Please select a logo file');
    return;
  }

  setUploadingLogo(true);
  const result = await uploadSchoolLogo(logoFile);
  
  if (result.success) {
    setSuccessMessage('Logo uploaded successfully!');
    setLogoFile(null);
  } else {
    setErrorMessage(result.error);
  }
  
  setUploadingLogo(false);
  setTimeout(() => { setSuccessMessage(''); setErrorMessage(''); }, 3000);
};

const handleUpdateLogo = async () => {
  if (!logoFile) {
    setErrorMessage('Please select a logo file');
    return;
  }

  setUploadingLogo(true);
  const result = await updateSchoolLogo(logoFile);
  
  if (result.success) {
    setSuccessMessage('Logo updated successfully!');
    setLogoFile(null);
  } else {
    setErrorMessage(result.error);
  }
  
  setUploadingLogo(false);
  setTimeout(() => { setSuccessMessage(''); setErrorMessage(''); }, 3000);
};

  const renderPostCard = (post, showTrendingToggle = true) => {
    const isEditing = editingPost === post._id;
    const isDeleting = deletingPost === post._id;

    return (
      <div key={post._id} className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all bg-white hover:border-indigo-300 relative">
        {/* Delete Confirmation Modal */}
        {isDeleting && (
          <div className="absolute inset-0 bg-white bg-opacity-95 rounded-xl flex items-center justify-center z-10 border-2 border-red-500">
            <div className="text-center p-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Post?</h3>
              <p className="text-gray-600 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleConfirmDelete(post._id)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 capitalize flex items-center gap-1.5">
              {post.postType === 'text' && <FileText className="w-3.5 h-3.5" />}
              {post.postType === 'poll' && <BarChart3 className="w-3.5 h-3.5" />}
              {post.postType === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
              {post.postType}
            </span>
            {post.isTrending && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                Trending
              </span>
            )}
            {post.manuallyTrending?.isSet && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Manual
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isEditing && !isDeleting && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleEditClick(post)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-semibold"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => handleDeleteClick(post._id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

        {/* Trending Toggle */}
        {showTrendingToggle && !isEditing && (
          <div className="mb-3 flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-700">Set as Trending</span>
            </div>
            <button
              onClick={() => handleToggleTrending(post._id, post.isTrending)}
              disabled={togglingTrending[post._id]}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                post.isTrending
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              } ${togglingTrending[post._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {togglingTrending[post._id] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-xs">Updating...</span>
                </>
              ) : (
                <>
                  {post.isTrending ? (
                    <>
                      <ToggleRight className="w-5 h-5" />
                      <span className="text-xs">ON</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5" />
                      <span className="text-xs">OFF</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        )}

        {/* School/Group Info */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {post.schoolId && (
            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {typeof post.schoolId === 'object' ? post.schoolId.name : post.school || 'School Post'}
            </span>
          )}
          {!post.schoolId && (
            <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-semibold">
              🌍 {post.school || 'Global Post'}
            </span>
          )}
          {post.trendingType && (
            <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold">
              {post.trendingType}
            </span>
          )}
          {post.trendingScore !== undefined && (
            <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-semibold">
              Score: {post.trendingScore}
            </span>
          )}
        </div>

        {/* Edit Mode */}
        {isEditing ? (
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Edit Message</label>
              <textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                rows="4"
                placeholder="Edit your post message..."
              />
            </div>

            {/* Existing Images */}
            {editImages.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Images</label>
                <div className="flex flex-wrap gap-2">
                  {editImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={img} 
                        alt={`Current ${idx}`} 
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Add New Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              {newImages.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">{newImages.length} new image(s) selected</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleSaveEdit(post._id)}
                disabled={savingEdit}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingEdit ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={savingEdit}
                className="flex items-center gap-2 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Post Message */}
            <p className="text-sm text-gray-800 mb-3 font-medium leading-relaxed">{post.message}</p>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
              <div className="mb-3">
                <img 
                  src={post.images[0]} 
                  alt="Post" 
                  className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
                />
              </div>
            )}
          </>
        )}

        {/* Poll Options */}
        {post.poll && post.poll.options && post.poll.options.length > 0 && !isEditing && (
          <div className="mb-3 space-y-2">
            <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Poll Results:
            </p>
            {post.poll.options.map((option, idx) => (
              <div key={idx} className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-700">{option.optionText}</span>
                  <span className="text-indigo-600 font-bold">{option.votes} votes</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Groups Tags */}
        {post.groups && post.groups.length > 0 && !isEditing && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.groups.map((group) => (
              <span key={group._id} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" />
                {group.name}
              </span>
            ))}
          </div>
        )}

        {/* Reactions */}
        {post.reaction && post.reaction.length > 0 && !isEditing && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
            <span className="text-xs text-gray-600 font-medium">Reactions:</span>
            <div className="flex gap-1">
              {post.reaction.map((r, idx) => (
                <span key={idx} className="text-lg">
                  {getReactionIcon(r.reaction)}
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {post.reaction.length} reaction{post.reaction.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-indigo-600 rounded-xl shadow-lg">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">View Posts</h1>
              <p className="text-gray-600 mt-2 font-medium">Browse and manage posts</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl flex items-center gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl flex items-center gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="inline-flex bg-white rounded-xl shadow-md p-1 border border-gray-200">
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'schools'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setViewMode('schools')}
            >
              <School className="w-5 h-5" />
              Schools
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'groups'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setViewMode('groups')}
            >
              <Users className="w-5 h-5" />
              Groups
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'trending'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setViewMode('trending')}
            >
              <TrendingUp className="w-5 h-5" />
              Trending
            </button>
          </div>
        </div>
        {/* Logo Upload Section */}
<div className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">School Logo Management</h2>
  <div className="flex flex-col sm:flex-row gap-4 items-end">
    <div className="flex-1">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Logo</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleLogoChange}
        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
      />
    </div>
    <div className="flex gap-2">
      <button
        onClick={handleUploadLogo}
        disabled={uploadingLogo || !logoFile}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {uploadingLogo ? 'Uploading...' : 'Upload'}
      </button>
      <button
        onClick={handleUpdateLogo}
        disabled={uploadingLogo || !logoFile}
        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {uploadingLogo ? 'Updating...' : 'Update'}
      </button>
    </div>
  </div>
</div>

        {viewMode === 'trending' ? (
          // Trending Posts View
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                Trending Posts
              </h2>
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg">
                {trendingPosts.length} trending
              </span>
            </div>

            {loadingTrending ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading trending posts...</p>
              </div>
            ) : trendingPosts.length > 0 ? (
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                {trendingPosts.map((post) => renderPostCard(post, false))}
              </div>
            ) : (
              <div className="text-center py-16">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Trending Posts</h3>
                <p className="text-gray-600">There are no trending posts at the moment.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schools/Groups List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-indigo-600" />
                  {viewMode === 'schools' ? 'Select School' : 'Select Group'}
                </h2>

                {viewMode === 'schools' ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {loadingSchools ? (
                      <p className="text-center text-gray-500 py-8">Loading schools...</p>
                    ) : schools.length > 0 ? (
                      schools.map((school) => (
                        <button
                          key={school._id}
                          onClick={() => handleSchoolClick(school)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedSchool?._id === school._id
                              ? 'bg-indigo-50 border-indigo-600'
                              : 'bg-white border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className={`w-5 h-5 ${selectedSchool?._id === school._id ? 'text-indigo-600' : 'text-gray-400'}`} />
                              <h3 className="font-bold text-gray-900">{school.name}</h3>
                            </div>
                            <ChevronRight className={`w-5 h-5 ${selectedSchool?._id === school._id ? 'text-indigo-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex gap-4 text-sm mt-2">
                            <span className="text-gray-600">
                              <span className="font-semibold text-indigo-600">{school.postCount}</span> posts
                            </span>
                            <span className="text-gray-600">
                              <span className="font-semibold text-indigo-600">{school.adminCount}</span> admins
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No schools found</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {loadingGroups ? (
                      <p className="text-center text-gray-500 py-8">Loading groups...</p>
                    ) : groups.length > 0 ? (
                      groups.map((group) => (
                        <button
                          key={group._id}
                          onClick={() => handleGroupClick(group)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedGroup?._id === group._id
                              ? 'bg-indigo-50 border-indigo-600'
                              : 'bg-white border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Users className={`w-5 h-5 ${selectedGroup?._id === group._id ? 'text-indigo-600' : 'text-gray-400'}`} />
                              <h3 className="font-bold text-gray-900">{group.name}</h3>
                            </div>
                            <ChevronRight className={`w-5 h-5 ${selectedGroup?._id === group._id ? 'text-indigo-600' : 'text-gray-400'}`} />
                          </div>
                          {group.description && (
                            <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                          )}
                          <span className="text-sm text-gray-600">
                            <span className="font-semibold text-indigo-600">{group.membersCount || 0}</span> members
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No groups found</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Posts Display */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                {!selectedSchool && !selectedGroup ? (
                  <div className="text-center py-16">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Selection</h3>
                    <p className="text-gray-600">
                      Select a {viewMode === 'schools' ? 'school' : 'group'} to view posts
                    </p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading posts...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedSchool ? selectedSchool.name : selectedGroup?.name}
                      </h2>
                      <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg">
                        {posts.length} posts
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                      {posts.length > 0 ? (
                        posts.map((post) => renderPostCard(post))
                      ) : (
                        <div className="text-center py-16">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-xl font-bold text-gray-900 mb-2">No Posts Found</h3>
                          <p className="text-gray-600">
                            This {viewMode === 'schools' ? 'school' : 'group'} doesn't have any posts yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ViewPosts;