'use client'
import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Building2, User, Package, Calendar } from 'lucide-react';

export default function SchoolAdminPanel() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const COACH_TYPES = [
  "Addiction Recovery Coach",
  "Yoga Instructor",
  "Arthritis and Joint Health Coach",
  "Ayurveda Consultant",
  "Cardiovascular Health Coach",
  "Chronic Pain Management Coach",
  "Dermatologist Consultant",
  "Detox and Clean Eating Coach",
  "Diabetes Management Coach",
  "Health & Fitness Coach",
  "Holistic Wellness Coach",
  "Immunity Coach for Kids",
  "Lifestyle Transformation Coach",
  "Mental Health Support Coach",
  "Parenting Wellness Coach",
  "Post-Surgery Recovery Coach",
  "Relationship and Couples Coach",
  "Reproductive Health Coach",
  "Skin and Beauty Wellness Coach",
  "Sleep Wellness Coach",
  "Therapeutic Coach",
  "Weight Management Coach",
  "Women’s Health Coach",
  "Work-Life Balance Coach",
  "Workplace Stress Coach",
  "Financial Wellness Coach",
  "Communication Coach",
  "Leadership Coach"
];


  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    Address: '',
    city: '',
    state: '',
    pincode: '',
    companyCode: '',
    hrName: '',
    principal: '',
    schoolType: 'Private',
    boardAffliation: 'NA',
    packageDetails: {
      name: '',
      studentCount: '',
      groupSize: '',
      groupCount: '',
      sessionCount: '',
      monthPlan: '',
      coachType: [],
      costperStudentpermonth: '',
      startDate: '',
      endDate: ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('package.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        packageDetails: {
          ...prev.packageDetails,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCoachTypeChange = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        coachType: options
      }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const token = localStorage.getItem('corporate_token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login first.');
      }

      const payload = {
        ...formData,
        uid: parseInt(formData.uid),
        packageDetails: {
          ...formData.packageDetails,
          studentCount: parseInt(formData.packageDetails.studentCount),
          groupSize: parseInt(formData.packageDetails.groupSize),
          groupCount: parseInt(formData.packageDetails.groupCount),
          sessionCount: parseInt(formData.packageDetails.sessionCount),
          monthPlan: parseInt(formData.packageDetails.monthPlan),
          costperStudentpermonth: parseFloat(formData.packageDetails.costperStudentpermonth)
        }
      };

      const res = await fetch('http://localhost:3000/api/v1/superAdmin/createSchool', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create Corporate');
      }

      setResponse(data);
      setFormData({
        uid: '',
        name: '',
        Address: '',
        city: '',
        state: '',
        pincode: '',
        companyCode: '',
        hrName: '',
        principal: '',
        schoolType: 'Private',
        boardAffliation: 'NA',
        packageDetails: {
          name: '',
          studentCount: '',
          groupSize: '',
          groupCount: '',
          sessionCount: '',
          monthPlan: '',
          coachType: [],
          costperStudentpermonth: '',
          startDate: '',
          endDate: ''
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8" />
            Corporate Creation Admin Panel
            </h1>
            <p className="text-blue-100 mt-2">Create and manage Corporate registrations</p>
          </div>

          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {response && (
            <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800">Success</h3>
                <p className="text-green-700 text-sm mt-1">Corporate created successfully!</p>
              </div>
            </div>
          )}

          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UID *</label>
                  <input
                    type="number"
                    name="uid"
                    value={formData.uid}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corporate Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="TechCorp"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    name="Address"
                    value={formData.Address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Corporate Lane"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="New Delhi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Delhi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="110001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Code *</label>
                  <input
                    type="text"
                    name="companyCode"
                    value={formData.companyCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="TC101"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HR Name *</label>
                  <input
                    type="text"
                    name="hrName"
                    value={formData.hrName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Principal *</label>
                  <input
                    type="text"
                    name="principal"
                    value={formData.principal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corporate Type *</label>
                  <select
                    name="schoolType"
                    value={formData.schoolType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                    <option value="Charter">Charter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Board Affiliation *</label>
                  <input
                    type="text"
                    name="boardAffliation"
                    value={formData.boardAffliation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="NA"
                  />
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Package Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                  <input
                    type="text"
                    name="package.name"
                    value={formData.packageDetails.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Premium Plan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Count *</label>
                  <input
                    type="number"
                    name="package.studentCount"
                    value={formData.packageDetails.studentCount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Size *</label>
                  <input
                    type="number"
                    name="package.groupSize"
                    value={formData.packageDetails.groupSize}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Count *</label>
                  <input
                    type="number"
                    name="package.groupCount"
                    value={formData.packageDetails.groupCount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Count *</label>
                  <input
                    type="number"
                    name="package.sessionCount"
                    value={formData.packageDetails.sessionCount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month Plan *</label>
                  <input
                    type="number"
                    name="package.monthPlan"
                    value={formData.packageDetails.monthPlan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Student per Month *</label>
                  <input
                    type="number"
                    name="package.costperStudentpermonth"
                    value={formData.packageDetails.costperStudentpermonth}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coach Type * (Hold Ctrl/Cmd to select multiple)</label>
                 <select
  name="package.coachType"
  value={formData.packageDetails.coachType}
  onChange={handleCoachTypeChange}
  multiple
  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
             h-40"
>
  {COACH_TYPES.map((coach, index) => (
    <option key={index} value={coach}>
      {coach}
    </option>
  ))}
</select>

                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="package.startDate"
                    value={formData.packageDetails.startDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="package.endDate"
                    value={formData.packageDetails.endDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? 'Creating Corporate...' : 'Create Corporate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}