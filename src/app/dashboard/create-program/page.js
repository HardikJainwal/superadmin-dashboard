'use client'
import React, { useState } from 'react';
import { createProgram } from '@/lib/program';

export default function CreateProgram() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schoolId: '',
    modules: [{ title: '', videoUrl: '', order: 1 }]
  });

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

            <div>
              <label className="block text-gray-700 font-medium mb-2">School ID</label>
              <input
                type="text"
                name="schoolId"
                value={formData.schoolId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 68a4117f518700bc75ae09ff"
                // required
              />
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