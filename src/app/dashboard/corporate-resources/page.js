'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';

const API_URL = 'https://api.humanova.live/api/v1/superAdmin/resource';
const API_BASE = 'https://api.humanova.live/api/v1';

const ResourceAdminPanel = () => {
  const [resources, setResources] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'youtube',
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    articleUrl: '',
    pdfUrl: '',
    schoolId: '',
    time: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchingResources, setFetchingResources] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // School selection state
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef(null);

  const resourceTypes = [
    { value: 'youtube', label: 'YouTube Video', urlField: 'videoUrl' },
    { value: 'audio', label: 'Audio', urlField: 'audioUrl' },
    { value: 'article', label: 'Article', urlField: 'articleUrl' },
    { value: 'pdf', label: 'PDF Document', urlField: 'pdfUrl' }
  ];

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('corporate_token');
  };

  // Fetch all schools with pagination
  const fetchSchools = async () => {
    const token = getAuthToken();
    if (!token) return;

    setSchoolsLoading(true);
    try {
      let allSchools = [];
      let currentPage = 1;
      let totalPages = 1;

      while (currentPage <= totalPages) {
        const response = await fetch(`${API_BASE}/superAdmin/schools?page=${currentPage}&limit=100`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) break;

        const result = await response.json();
        allSchools = [...allSchools, ...(result.schools || result.data || [])];
        totalPages = result.totalPages || 1;
        currentPage++;
      }

      setSchools(allSchools);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setSchoolsLoading(false);
    }
  };

  // Close school dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(e.target)) {
        setIsSchoolDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSchools = schools.filter((school) => {
    const name = (school.schoolName || school.name || '').toLowerCase();
    const id = (school._id || '').toLowerCase();
    const query = schoolSearch.toLowerCase();
    return name.includes(query) || id.includes(query);
  });

  const selectedSchool = schools.find((s) => s._id === formData.schoolId);
  const selectedSchoolName = selectedSchool
    ? (selectedSchool.schoolName || selectedSchool.name || selectedSchool._id)
    : '';

  const handleSelectSchool = (school) => {
    setFormData((prev) => ({ ...prev, schoolId: school._id }));
    setSchoolSearch('');
    setIsSchoolDropdownOpen(false);
  };

  const handleClearSchool = () => {
    setFormData((prev) => ({ ...prev, schoolId: '' }));
    setSchoolSearch('');
  };

  const getCurrentUrlField = () => {
    const type = resourceTypes.find(t => t.value === formData.type);
    return type ? type.urlField : 'videoUrl';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'youtube',
      imageUrl: '',
      videoUrl: '',
      audioUrl: '',
      articleUrl: '',
      pdfUrl: '',
      schoolId: '',
      time: ''
    });
    setEditingId(null);
    setIsFormOpen(false);
    setSchoolSearch('');
    setIsSchoolDropdownOpen(false);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Fetch resources from API
  const fetchResources = async () => {
    const token = getAuthToken();
    if (!token) {
      showMessage('error', 'Authentication token not found. Please check localStorage.');
      return;
    }

    setFetchingResources(true);
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        // Handle different response structures
        let resourcesData = [];
        if (Array.isArray(data)) {
          resourcesData = data;
        } else if (data.data && Array.isArray(data.data)) {
          resourcesData = data.data;
        } else if (data.resources && Array.isArray(data.resources)) {
          resourcesData = data.resources;
        }
        
        setResources(resourcesData);
      } else {
        showMessage('error', 'Failed to fetch resources');
        setResources([]);
      }
    } catch (error) {
      showMessage('error', 'Error fetching resources: ' + error.message);
      setResources([]);
    } finally {
      setFetchingResources(false);
    }
  };

  // Fetch resources and schools on component mount
  useEffect(() => {
    fetchResources();
    fetchSchools();
  }, []);

  const handleSubmit = async () => {
    if (!formData.title || !formData[getCurrentUrlField()]) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      showMessage('error', 'Authentication token not found. Please check localStorage.');
      return;
    }

    setLoading(true);

    const urlField = getCurrentUrlField();
    const payload = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      imageUrl: formData.imageUrl,
      [urlField]: formData[urlField],
      time: formData.time
    };

    // Only include schoolId if it's not empty
    if (formData.schoolId && formData.schoolId.trim() !== '') {
      payload.schoolId = formData.schoolId.trim();
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showMessage('success', 'Resource created successfully!');
        resetForm();
        fetchResources(); // Refresh the list
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.message || 'Failed to create resource');
      }
    } catch (error) {
      showMessage('error', 'Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource) => {
    setFormData(resource);
    setEditingId(resource._id || resource.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setResources(prev => prev.filter(r => (r._id || r.id) !== id));
      showMessage('success', 'Resource deleted successfully!');
    }
  };

  // Helper to get school name by ID (for the resource list)
  const getSchoolNameById = (id) => {
    const school = schools.find(s => s._id === id);
    return school ? (school.schoolName || school.name || id) : id;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resource Management</h1>
              <p className="text-gray-600 mt-1">Manage your educational resources</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchResources}
                disabled={fetchingResources}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={20} className={fetchingResources ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add Resource
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Resource' : 'Add New Resource'}
                  </h2>
                  <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter resource title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter resource description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resource Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {resourceTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {resourceTypes.find(t => t.value === formData.type)?.label} URL *
                    </label>
                    <input
                      type="url"
                      name={getCurrentUrlField()}
                      value={formData[getCurrentUrlField()]}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Enter ${formData.type} URL`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter thumbnail/cover image URL"
                    />
                  </div>

                  {/* School Selection Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School / Organization (Optional)
                      {schools.length > 0 && (
                        <span className="text-xs font-normal text-gray-400 ml-2">
                          ({schools.length} available)
                        </span>
                      )}
                    </label>

                    {schoolsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400 py-2.5 px-3 bg-gray-50 border border-gray-300 rounded-lg">
                        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Loading schools...
                      </div>
                    ) : (
                      <div className="relative" ref={schoolDropdownRef}>
                        {/* Selected school display */}
                        {formData.schoolId && !isSchoolDropdownOpen ? (
                          <div className="flex items-center justify-between w-full px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                              <span className="text-sm font-medium text-gray-800 truncate">{selectedSchoolName}</span>
                              <span className="text-xs text-gray-400 font-mono flex-shrink-0">({formData.schoolId.slice(-8)})</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSchoolDropdownOpen(true);
                                  setSchoolSearch('');
                                }}
                                className="p-1 hover:bg-blue-100 rounded transition-colors text-gray-400 hover:text-blue-600"
                                title="Change school"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={handleClearSchool}
                                className="p-1 hover:bg-red-100 rounded transition-colors text-gray-400 hover:text-red-500"
                                title="Clear (make global)"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="relative">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16" height="16"
                                viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              >
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                              </svg>
                              <input
                                type="text"
                                value={schoolSearch}
                                onChange={(e) => {
                                  setSchoolSearch(e.target.value);
                                  setIsSchoolDropdownOpen(true);
                                }}
                                onFocus={() => setIsSchoolDropdownOpen(true)}
                                placeholder="Search schools by name or ID... (leave empty for global)"
                                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                autoComplete="off"
                              />
                            </div>

                            {/* Dropdown list */}
                            {isSchoolDropdownOpen && (
                              <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {/* Global option */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleClearSchool();
                                    setIsSchoolDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors flex items-center gap-2 border-b border-gray-100 ${
                                    !formData.schoolId ? 'bg-green-50' : ''
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${!formData.schoolId ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                  <span className="text-sm font-medium text-green-700">🌍 Global (All Schools)</span>
                                </button>

                                {filteredSchools.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                    {schoolSearch ? 'No schools match your search' : 'No schools found'}
                                  </div>
                                ) : (
                                  filteredSchools.map((school) => (
                                    <button
                                      key={school._id}
                                      type="button"
                                      onClick={() => handleSelectSchool(school)}
                                      className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between group ${
                                        formData.schoolId === school._id ? 'bg-blue-50' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                          formData.schoolId === school._id ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-400'
                                        }`}></span>
                                        <span className="text-sm font-medium text-gray-800 truncate">
                                          {school.schoolName || school.name || 'Unnamed School'}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-400 font-mono flex-shrink-0 ml-2">
                                        {school._id?.slice(-8)}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to make this resource available to all schools
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration/Time
                    </label>
                    <input
                      type="text"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 3 Minutes, 15 Pages, etc."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={20} />
                      {loading ? 'Saving...' : 'Save Resource'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Resources ({resources.length})
              {fetchingResources && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
            </h2>
          </div>
          
          {fetchingResources ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No resources yet</p>
              <p className="text-sm mt-2">Click &quot;Add Resource&quot; to create your first resource</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Array.isArray(resources) && resources.map(resource => (
                <div key={resource._id || resource.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {resourceTypes.find(t => t.value === resource.type)?.label || resource.type}
                        </span>
                        {resource.schoolId && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                            🏫 {getSchoolNameById(resource.schoolId)}
                          </span>
                        )}
                        {!resource.schoolId && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Global
                          </span>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {resource.time && <span>⏱️ {resource.time}</span>}
                        {resource.videoUrl && <span className="truncate max-w-md">🎥 {resource.videoUrl}</span>}
                        {resource.audioUrl && <span className="truncate max-w-md">🎵 {resource.audioUrl}</span>}
                        {resource.articleUrl && <span className="truncate max-w-md">📄 {resource.articleUrl}</span>}
                        {resource.pdfUrl && <span className="truncate max-w-md">📕 {resource.pdfUrl}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(resource._id || resource.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceAdminPanel;