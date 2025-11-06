'use client'
import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { createTip ,getAllTips , updateTip, deleteTip } from '@/lib/dailyTip';

export default function TipsManagement() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [formData, setFormData] = useState({ text: '', date: '' });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    setLoading(true);
    const result = await getAllTips();
    if (result.success) {
      setTips(result.data);
    } else {
      showNotification(result.error, 'error');
    }
    setLoading(false);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (editingTip) {
      result = await updateTip(editingTip._id, formData.text, formData.date);
    } else {
      result = await createTip(formData.text, formData.date);
    }

    if (result.success) {
      showNotification(result.message);
      setShowModal(false);
      setFormData({ text: '', date: '' });
      setEditingTip(null);
      fetchTips();
    } else {
      showNotification(result.error, 'error');
    }
    setLoading(false);
  };

  const handleEdit = (tip) => {
    setEditingTip(tip);
    setFormData({
      text: tip.text,
      date: tip.date ? new Date(tip.date).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (tipId) => {
    if (!confirm('Are you sure you want to delete this tip?')) return;
    
    setLoading(true);
    const result = await deleteTip(tipId);
    
    if (result.success) {
      showNotification(result.message);
      fetchTips();
    } else {
      showNotification(result.error, 'error');
    }
    setLoading(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTip(null);
    setFormData({ text: '', date: '' });
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Tips Management</h1>
            <p className="text-gray-600 mt-1">Manage daily health tips for users</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add New Tip
          </button>
        </div>
      </div>

      {/* Tips List */}
      <div className="max-w-6xl mx-auto">
        {loading && !showModal ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading tips...</p>
          </div>
        ) : tips.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No tips found. Create your first tip!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tips.map((tip) => (
              <div key={tip._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-800 text-lg mb-2">{tip.text}</p>
                    {tip.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={16} />
                        <span>Scheduled for: {new Date(tip.date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(tip)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(tip._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingTip ? 'Edit Tip' : 'Create New Tip'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Tip Text *
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Enter health tip..."
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Date (Optional - for future tips)
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={getTodayDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty for today, or select a future date
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : editingTip ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}