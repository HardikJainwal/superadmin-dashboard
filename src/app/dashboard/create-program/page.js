'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createProgram, getAllSchools } from '@/lib/program';

export default function CreateProgram() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // School selection state
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schoolId: '',
    modules: [{ title: '', videoUrl: '', order: 1 }]
  });

  // Fetch schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      setSchoolsLoading(true);
      try {
        const result = await getAllSchools();
        if (result.success) {
          setSchools(result.data || []);
        } else {
          console.error('Failed to fetch schools:', result.error);
        }
      } catch (err) {
        console.error('Error fetching schools:', err);
      } finally {
        setSchoolsLoading(false);
      }
    };
    fetchSchools();
  }, []);

  // Close dropdown on outside click
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModuleChange = (index, field, value) => {
    const newModules = [...formData.modules];
    newModules[index][field] = field === 'order' ? parseInt(value) : value;
    setFormData(prev => ({ ...prev, modules: newModules }));
  };

  const addModule = () => {
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, { title: '', videoUrl: '', order: prev.modules.length + 1 }]
    }));
  };

  const removeModule = (index) => {
    const newModules = formData.modules.filter((_, i) => i !== index);
    newModules.forEach((module, i) => module.order = i + 1);
    setFormData(prev => ({ ...prev, modules: newModules }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await createProgram(formData);

    if (result.success) {
      setSuccess('Program created successfully!');
      setFormData({
        title: '',
        description: '',
        schoolId: '',
        modules: [{ title: '', videoUrl: '', order: 1 }]
      });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Program</h1>

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Full Stack Development Bootcamp"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="e.g., Learn JS stack in 4 weeks"
                required
              />
            </div>

            {/* School Selection Dropdown */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                School / Organization
                {schools.length > 0 && (
                  <span className="text-xs font-normal text-gray-400 ml-2">
                    ({schools.length} available)
                  </span>
                )}
              </label>

              {schoolsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2.5 px-4 bg-gray-50 border rounded-lg">
                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Loading schools...
                </div>
              ) : (
                <div className="relative" ref={schoolDropdownRef}>
                  {/* Selected school display / search input */}
                  {formData.schoolId && !isSchoolDropdownOpen ? (
                    <div className="flex items-center justify-between w-full px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        <span className="text-sm font-medium text-gray-800">{selectedSchoolName}</span>
                        <span className="text-xs text-gray-400 font-mono">({formData.schoolId.slice(-8)})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSchoolDropdownOpen(true);
                            setSchoolSearch('');
                          }}
                          className="p-1 hover:bg-blue-100 rounded transition-colors text-gray-400 hover:text-blue-600"
                          title="Change school"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                            <path d="M3 3v5h5"/>
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                            <path d="M16 16h5v5"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleClearSchool}
                          className="p-1 hover:bg-red-100 rounded transition-colors text-gray-400 hover:text-red-500"
                          title="Clear selection"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
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
                          placeholder="Search schools by name or ID..."
                          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          autoComplete="off"
                        />
                      </div>

                      {/* Dropdown list */}
                      {isSchoolDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-gray-700 font-medium">Modules</label>
                <button
                  type="button"
                  onClick={addModule}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition"
                >
                  + Add Module
                </button>
              </div>

              {formData.modules.map((module, index) => (
                <div key={index} className="border rounded-lg p-4 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700">Module {index + 1}</span>
                    {formData.modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeModule(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Module Title (e.g., Intro to React)"
                      value={module.title}
                      onChange={(e) => handleModuleChange(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />

                    <input
                      type="url"
                      placeholder="Video URL (e.g., https://www.youtube.com/watch?v=abcd1234)"
                      value={module.videoUrl}
                      onChange={(e) => handleModuleChange(index, 'videoUrl', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />

                    <input
                      type="number"
                      placeholder="Order"
                      value={module.order}
                      onChange={(e) => handleModuleChange(index, 'order', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating Program...' : 'Create Program'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}