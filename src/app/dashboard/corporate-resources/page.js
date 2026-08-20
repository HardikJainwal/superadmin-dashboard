'use client'
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Save,
  X,
  RefreshCw,
  ExternalLink,
  Play,
  Music,
  FileText,
  Video,
  Globe,
  Clock,
  Sparkles,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_URL = 'https://api.humanova.live/api/v1/superAdmin/resource/admin';
const API_POST_URL = 'https://api.humanova.live/api/v1/superAdmin/resource';
const API_BASE = 'https://api.humanova.live/api/v1';

// Google Drive & General Image URL Helper
const getDisplayImageUrl = (url) => {
  if (!url) return null;
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
    }
  }
  return url;
};

// Helper to get active media URL for a resource
const getMediaUrl = (resource) => {
  return (
    resource.videoUrl ||
    resource.audioUrl ||
    resource.articleUrl ||
    resource.pdfUrl ||
    resource.url ||
    resource.link ||
    ''
  );
};

const ResourceAdminPanel = () => {
  const [resources, setResources] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  // Filtering & Pagination State
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);

  // School selection state
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef(null);

  const resourceTypes = [
    { value: 'youtube', label: 'YouTube Video', urlField: 'videoUrl', icon: Video },
    { value: 'audio', label: 'Audio Track', urlField: 'audioUrl', icon: Music },
    { value: 'article', label: 'Article', urlField: 'articleUrl', icon: FileText },
    { value: 'pdf', label: 'PDF Document', urlField: 'pdfUrl', icon: FileText }
  ];

  // Get token from localStorage with fallback keys
  const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem('corporate_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('school_token') ||
      localStorage.getItem('website_token') ||
      ''
    );
  };

  // Fetch all schools with pagination
  const fetchSchools = async () => {
    const token = getAuthToken();
    if (!token) return;

    setSchoolsLoading(true);
    try {
      let allSchools = [];
      let pageNum = 1;
      let maxPages = 1;

      while (pageNum <= maxPages) {
        const response = await fetch(`${API_BASE}/superAdmin/schools?page=${pageNum}&limit=100`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) break;

        const result = await response.json();
        allSchools = [...allSchools, ...(result.schools || result.data || [])];
        maxPages = result.totalPages || 1;
        pageNum++;
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
    setIsFormOpen(false);
    setSchoolSearch('');
    setIsSchoolDropdownOpen(false);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Fetch resources from API with Type filter and Pagination
  const fetchResources = async (page = 1, typeFilter = activeTypeFilter) => {
    const token = getAuthToken();
    if (!token) {
      showMessage('error', 'Authentication token missing. Please log in to Corporate Management.');
      return;
    }

    setFetchingResources(true);
    try {
      let queryUrl = `${API_URL}?page=${page}&limit=${limit}`;
      if (typeFilter && typeFilter !== 'all') {
        queryUrl += `&type=${typeFilter}`;
      }

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        let resourcesData = [];
        if (Array.isArray(data)) {
          resourcesData = data;
        } else if (data.results && Array.isArray(data.results)) {
          resourcesData = data.results;
        } else if (data.data && Array.isArray(data.data)) {
          resourcesData = data.data;
        } else if (data.resources && Array.isArray(data.resources)) {
          resourcesData = data.resources;
        }
        
        setResources(resourcesData);
        if (data.totalPages !== undefined) setTotalPages(data.totalPages);
        if (data.total !== undefined) setTotalCount(data.total);
        if (data.page !== undefined) setCurrentPage(data.page);
      } else {
        const errJson = await response.json().catch(() => ({}));
        const serverMsg = errJson.message || errJson.error || errJson.msg || `HTTP ${response.status}`;
        showMessage(
          'error',
          `${serverMsg}. Please log in to Corporate Management to get a valid admin token.`
        );
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
    fetchResources(1, 'all');
    fetchSchools();
  }, []);

  // Handle Type Filter Tab Selection
  const handleFilterChange = (filterType) => {
    setActiveTypeFilter(filterType);
    setCurrentPage(1);
    fetchResources(1, filterType);
  };

  // Handle Page Change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchResources(newPage, activeTypeFilter);
  };

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
      const response = await fetch(API_POST_URL, {
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
        fetchResources(1, activeTypeFilter); // Refresh list
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

  // Helper to get school name by ID (for the resource list)
  const getSchoolNameById = (id) => {
    const school = schools.find(s => s._id === id);
    return school ? (school.schoolName || school.name || id) : id;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Sparkles size={24} />
              </div>
              Resource Management
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              Publish and organize educational audio tracks, videos, PDFs, and articles
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchResources(currentPage, activeTypeFilter)}
              disabled={fetchingResources}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={fetchingResources ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all"
            >
              <Plus size={18} />
              Add Resource
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`p-4 rounded-xl text-sm font-medium border shadow-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-800">Add New Resource</h2>
                  <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 p-1">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter resource title"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter resource description"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Resource Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {resourceTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {resourceTypes.find(t => t.value === formData.type)?.label} URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      name={getCurrentUrlField()}
                      value={formData[getCurrentUrlField()]}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={`Enter ${formData.type} URL`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Image URL / Cover Thumbnail
                    </label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter thumbnail/cover image URL"
                    />
                  </div>

                  {/* School Selection Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      School / Organization (Optional)
                      {schools.length > 0 && (
                        <span className="text-xs font-normal text-slate-400 ml-2">
                          ({schools.length} available)
                        </span>
                      )}
                    </label>

                    {schoolsLoading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <RefreshCw size={14} className="animate-spin text-blue-500" />
                        Loading schools...
                      </div>
                    ) : (
                      <div className="relative" ref={schoolDropdownRef}>
                        {formData.schoolId && !isSchoolDropdownOpen ? (
                          <div className="flex items-center justify-between w-full px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 size={16} className="text-blue-600 flex-shrink-0" />
                              <span className="text-xs font-semibold text-slate-800 truncate">{selectedSchoolName}</span>
                              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">({formData.schoolId.slice(-8)})</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSchoolDropdownOpen(true);
                                  setSchoolSearch('');
                                }}
                                className="p-1 hover:bg-blue-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                                title="Change school"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={handleClearSchool}
                                className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-slate-400 hover:text-rose-500"
                                title="Clear (make global)"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={schoolSearch}
                              onChange={(e) => {
                                setSchoolSearch(e.target.value);
                                setIsSchoolDropdownOpen(true);
                              }}
                              onFocus={() => setIsSchoolDropdownOpen(true)}
                              placeholder="Search schools by name or ID... (leave empty for global)"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                              autoComplete="off"
                            />

                            {/* Dropdown list */}
                            {isSchoolDropdownOpen && (
                              <div className="absolute z-[60] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleClearSchool();
                                    setIsSchoolDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center gap-2 border-b border-slate-100 ${
                                    !formData.schoolId ? 'bg-emerald-50' : ''
                                  }`}
                                >
                                  <Globe size={14} className="text-emerald-600" />
                                  <span className="text-xs font-semibold text-emerald-700">Global (All Schools)</span>
                                </button>

                                {filteredSchools.length === 0 ? (
                                  <div className="px-4 py-3 text-xs text-slate-400 text-center">
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
                                        <Building2 size={14} className="text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                                        <span className="text-xs font-medium text-slate-800 truncate">
                                          {school.schoolName || school.name || 'Unnamed School'}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 ml-2">
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
                    <p className="text-[11px] text-slate-400 mt-1">
                      Leave empty to make this resource available to all schools
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Duration / Time
                    </label>
                    <input
                      type="text"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., 3 Minutes, 15 Pages, etc."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50"
                    >
                      <Save size={18} />
                      {loading ? 'Saving...' : 'Save Resource'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-sm font-semibold text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources Section with Type Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* Header & Type Filter Tabs */}
          <div className="space-y-4 border-b border-slate-100 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles size={20} className="text-blue-600" />
                  Resource Library ({totalCount || resources.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Filter educational resources by media type</p>
              </div>

              {fetchingResources && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 self-start md:self-auto">
                  <RefreshCw size={12} className="animate-spin" /> Fetching...
                </span>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTypeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Globe size={14} />
                All Resources
              </button>

              <button
                onClick={() => handleFilterChange('audio')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTypeFilter === 'audio'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Music size={14} />
                Audio Tracks
              </button>

              <button
                onClick={() => handleFilterChange('youtube')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTypeFilter === 'youtube'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Video size={14} />
                YouTube Videos
              </button>

              <button
                onClick={() => handleFilterChange('pdf')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTypeFilter === 'pdf'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText size={14} />
                PDF Documents
              </button>

              <button
                onClick={() => handleFilterChange('article')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTypeFilter === 'article'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText size={14} />
                Articles
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {fetchingResources && resources.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm font-medium">Fetching resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-base font-semibold text-slate-600">No resources found</p>
              <p className="text-xs mt-1 text-slate-400">No items match the selected filter tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(resources) &&
                resources.map((resource) => {
                  const mediaUrl = getMediaUrl(resource);
                  const displayImg = getDisplayImageUrl(resource.imageUrl);

                  return (
                    <div
                      key={resource._id || resource.id}
                      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Cover Header Image */}
                      <div className="relative w-full h-44 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 overflow-hidden flex items-center justify-center">
                        {displayImg ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={displayImg}
                            alt={resource.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}

                        {/* Fallback Icon Header when no image */}
                        {!displayImg && (
                          <div className="flex flex-col items-center gap-2 text-white/40">
                            {resource.type === 'youtube' && <Video size={38} className="text-rose-400" />}
                            {resource.type === 'audio' && <Music size={38} className="text-purple-400" />}
                            {(resource.type === 'pdf' || resource.type === 'article') && <FileText size={38} className="text-emerald-400" />}
                            {!['youtube', 'audio', 'pdf', 'article'].includes(resource.type) && <Globe size={38} className="text-blue-400" />}
                            <span className="text-[11px] font-semibold tracking-wide uppercase text-white/50">{resource.type}</span>
                          </div>
                        )}

                        {/* Type Badge */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md tracking-wider uppercase backdrop-blur-md flex items-center gap-1.5 ${
                              resource.type === 'youtube'
                                ? 'bg-rose-600/90 text-white'
                                : resource.type === 'audio'
                                ? 'bg-purple-600/90 text-white'
                                : resource.type === 'pdf'
                                ? 'bg-amber-600/90 text-white'
                                : 'bg-emerald-600/90 text-white'
                            }`}
                          >
                            {resource.type === 'youtube' && <Video size={12} />}
                            {resource.type === 'audio' && <Music size={12} />}
                            {resource.type === 'pdf' && <FileText size={12} />}
                            {resource.type === 'article' && <FileText size={12} />}
                            {resource.type}
                          </span>
                        </div>

                        {/* Organization Badge (SVG icon, no emojis) */}
                        <div className="absolute top-3 left-3">
                          {resource.schoolId ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-purple-800 shadow-md backdrop-blur-md flex items-center gap-1 truncate max-w-[160px]">
                              <Building2 size={12} className="text-purple-600" />
                              {getSchoolNameById(resource.schoolId)}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600/90 text-white shadow-md backdrop-blur-md flex items-center gap-1">
                              <Globe size={12} />
                              Global
                            </span>
                          )}
                        </div>

                        {/* Duration Tag */}
                        {resource.time && (
                          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md flex items-center gap-1">
                            <Clock size={12} className="text-amber-400" />
                            {resource.time}
                          </div>
                        )}
                      </div>

                      {/* Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                            {resource.title}
                          </h3>
                          {resource.description && (
                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                              {resource.description}
                            </p>
                          )}
                        </div>

                        {/* Media Launch Link */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          {mediaUrl ? (
                            <a
                              href={mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors w-full justify-center"
                            >
                              {resource.type === 'youtube' ? (
                                <>
                                  <Play size={14} className="fill-blue-600 text-blue-600" />
                                  Watch Video
                                </>
                              ) : resource.type === 'audio' ? (
                                <>
                                  <Music size={14} />
                                  Listen Audio
                                </>
                              ) : (
                                <>
                                  <ExternalLink size={14} />
                                  Open Resource
                                </>
                              )}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No media link available</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500">
                Showing{' '}
                <strong className="text-slate-800">
                  {Math.min((currentPage - 1) * limit + 1, totalCount)}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800">
                  {Math.min(currentPage * limit, totalCount)}
                </strong>{' '}
                of <strong className="text-slate-800">{totalCount}</strong> resources
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || fetchingResources}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                    .map((p, i, arr) => {
                      const prevP = arr[i - 1];
                      const showDots = prevP && p - prevP > 1;

                      return (
                        <React.Fragment key={p}>
                          {showDots && <span className="px-1 text-xs text-slate-400">...</span>}
                          <button
                            onClick={() => handlePageChange(p)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              currentPage === p
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || fetchingResources}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceAdminPanel;