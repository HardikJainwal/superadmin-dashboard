'use client';

import React, { useState, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Tag,
  DollarSign,
  Users,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Code,
  FileText,
  UserCheck,
  Layers,
  Sparkles,
  RotateCcw,
  X,
  Info,
  Globe,
  Building
} from 'lucide-react';
import { createEvent } from '@/lib/eventService';

const AUDIENCE_OPTIONS = [
  { value: 'restricted', label: 'Restricted / Corporate Employees (Invited Only)' }
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

const INITIAL_FORM = {
  title: '',
  description: '',
  type: 'physical', // "physical" or "virtual"
  audience: 'restricted',
  startTime: '',
  endTime: '',
  size: '100',
  priceType: 'free', // "free" or "paid"
  price: '',
  currency: 'INR',
  location: '',
  link: '',
  photo: null,
  features: [],
  roadMap: [],
  agendas: [],
  contactInfo: {
    email: '',
    phone: '',
    address: ''
  }
};

export default function CorporateEventsPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Input builders state
  const [newFeature, setNewFeature] = useState('');
  const [newAgenda, setNewAgenda] = useState({ time: '', title: '', description: '' });
  const [newRoadmap, setNewRoadmap] = useState({
    step: 1,
    time: '',
    title: '',
    description: '',
    timeTaken: ''
  });

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [name]: value }
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Please select a valid image file (JPEG, PNG)');
        return;
      }
      setFormData((prev) => ({ ...prev, photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  // Features builder
  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeature.trim()]
    }));
    setNewFeature('');
  };

  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Agendas builder
  const addAgenda = () => {
    if (!newAgenda.title.trim()) {
      showToast('error', 'Agenda item requires at least a title');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      agendas: [...prev.agendas, { ...newAgenda }]
    }));
    setNewAgenda({ time: '', title: '', description: '' });
  };

  const removeAgenda = (index) => {
    setFormData((prev) => ({
      ...prev,
      agendas: prev.agendas.filter((_, i) => i !== index)
    }));
  };

  // Roadmap builder
  const addRoadmap = () => {
    if (!newRoadmap.title.trim()) {
      showToast('error', 'Roadmap item requires a title');
      return;
    }
    if (!newRoadmap.time.trim()) {
      showToast('error', 'Roadmap item requires a time');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      roadMap: [
        ...prev.roadMap,
        {
          ...newRoadmap,
          step: prev.roadMap.length + 1
        }
      ]
    }));
    setNewRoadmap({
      step: formData.roadMap.length + 2,
      time: '',
      title: '',
      description: '',
      timeTaken: ''
    });
  };

  const removeRoadmap = (index) => {
    setFormData((prev) => {
      const updated = prev.roadMap.filter((_, i) => i !== index);
      // Re-index steps
      return {
        ...prev,
        roadMap: updated.map((item, idx) => ({ ...item, step: idx + 1 }))
      };
    });
  };

  // Validation & Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields check per API documentation
    if (!formData.title.trim()) {
      showToast('error', 'Title is required');
      return;
    }
    if (!formData.description.trim()) {
      showToast('error', 'Description is required');
      return;
    }
    if (!formData.startTime) {
      showToast('error', 'Start Time is required');
      return;
    }
    if (!formData.endTime) {
      showToast('error', 'End Time is required');
      return;
    }
    if (!formData.size) {
      showToast('error', 'Size (capacity) is required');
      return;
    }
    if (!formData.location.trim()) {
      showToast('error', 'Location is required');
      return;
    }
    if (formData.priceType === 'paid') {
      if (!formData.price) {
        showToast('error', 'Price is required for paid events');
        return;
      }
      if (!formData.currency) {
        showToast('error', 'Currency is required for paid events');
        return;
      }
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
      data.append('type', formData.type || 'physical'); // "physical" or "virtual"
      data.append('audience', 'restricted'); // Always "restricted" per backend schema enum requirement
      data.append('startTime', formData.startTime);
      data.append('endTime', formData.endTime);
      data.append('size', formData.size);
      data.append('priceType', formData.priceType || 'free'); // "free" or "paid"
      data.append('location', formData.location.trim());

      if (formData.priceType === 'paid') {
        if (formData.price) data.append('price', formData.price);
        if (formData.currency) data.append('currency', formData.currency);
      }

      if (formData.link && formData.link.trim()) {
        data.append('link', formData.link.trim());
      }

      if (formData.photo) {
        data.append('photo', formData.photo);
      }

      // Stringified JSON fields - only append when non-empty
      if (Array.isArray(formData.features) && formData.features.length > 0) {
        data.append('features', JSON.stringify(formData.features));
      }
      if (Array.isArray(formData.roadMap) && formData.roadMap.length > 0) {
        data.append('roadMap', JSON.stringify(formData.roadMap));
      }
      if (Array.isArray(formData.agendas) && formData.agendas.length > 0) {
        data.append('agendas', JSON.stringify(formData.agendas));
      }
      if (
        formData.contactInfo &&
        (formData.contactInfo.email?.trim() || formData.contactInfo.phone?.trim() || formData.contactInfo.address?.trim())
      ) {
        data.append('contactInfo', JSON.stringify(formData.contactInfo));
      }

      const result = await createEvent(data);
      setCreatedEvent(result);
      showToast('success', 'Event created successfully!');
    } catch (err) {
      console.error('Create Event API Error:', err);
      showToast('error', err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setPhotoPreview(null);
    setCreatedEvent(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium text-white transition-all animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.text}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                <Calendar size={26} />
              </div>
              Create Corporate Event
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              POST Endpoint: <code className="bg-slate-100 text-purple-700 px-2 py-0.5 rounded font-mono text-xs">/school/createEvent</code>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Code size={15} />
            {showJsonPreview ? 'Hide Payload Spec' : 'Inspect Payload Schema'}
          </button>
        </div>

        {/* Payload Schema Inspector */}
        {showJsonPreview && (
          <div className="bg-slate-900 text-emerald-400 p-5 rounded-2xl shadow-xl font-mono text-xs overflow-x-auto space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
              <span className="font-semibold text-white flex items-center gap-2">
                <Info size={14} className="text-cyan-400" />
                FormData Parameters Preview
              </span>
              <span className="text-purple-400">multipart/form-data</span>
            </div>
            <pre className="text-slate-200">
{JSON.stringify(
  {
    title: formData.title || '(required)',
    description: formData.description || '(required)',
    type: formData.type, // "physical" | "virtual"
    audience: 'restricted',
    startTime: formData.startTime || '(required ISO 8601)',
    endTime: formData.endTime || '(required ISO 8601)',
    size: formData.size || '(required capacity)',
    priceType: formData.priceType, // "free" | "paid"
    location: formData.location || '(required venue)',
    ...(formData.priceType === 'paid' && {
      price: formData.price || '(required for paid)',
      currency: formData.currency || '(required for paid)'
    }),
    link: formData.link || undefined,
    photo: formData.photo ? `[File: ${formData.photo.name}]` : undefined,
    features: formData.features?.length ? JSON.stringify(formData.features) : undefined,
    roadMap: formData.roadMap?.length ? JSON.stringify(formData.roadMap) : undefined,
    agendas: formData.agendas?.length ? JSON.stringify(formData.agendas) : undefined,
    contactInfo:
      formData.contactInfo?.email || formData.contactInfo?.phone || formData.contactInfo?.address
        ? JSON.stringify(formData.contactInfo)
        : undefined
  },
  null,
  2
)}
            </pre>
          </div>
        )}

        {/* Success View */}
        {createdEvent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Event Created Successfully!</h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Event <strong className="text-slate-800">&quot;{formData.title}&quot;</strong> has been published.
            </p>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-w-lg mx-auto text-left text-xs font-mono text-slate-700 overflow-x-auto">
              <p className="text-slate-500 font-bold mb-1">Server Response:</p>
              <pre>{JSON.stringify(createdEvent, null, 2)}</pre>
            </div>

            <div className="flex gap-3 justify-center pt-4">
              <button
                onClick={resetForm}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors"
              >
                <Plus size={16} />
                Create Another Event
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mandatory Section 1: Core Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-purple-600" />
                  Mandatory Event Information
                </h2>
                <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
                  Required Fields
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Type: Physical vs Virtual */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Event Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: 'physical' }))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                        formData.type === 'physical'
                          ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Building size={18} />
                      Physical Event
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: 'virtual' }))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                        formData.type === 'virtual'
                          ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Globe size={18} />
                      Virtual Event
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Annual Health & Wellness Summit"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description of the event..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Audience <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="audience"
                    value={formData.audience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Capacity Size (Slots) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      placeholder="100"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location / Venue <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder={
                        formData.type === 'physical'
                          ? 'e.g., Main Auditorium, Building 4, Tech Park'
                          : 'e.g., Virtual Zoom Meeting Room'
                      }
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Section 2: Pricing Logic */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <DollarSign size={18} className="text-purple-600" />
                Pricing Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="priceType"
                    value={formData.priceType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {formData.priceType === 'paid' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Price <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="499"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Currency <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                        required
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Optional Section: Photo & Meeting Link */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2">
                  <Upload size={18} className="text-purple-600" />
                  Media & Optional Registration Link
                </span>
                <span className="text-xs font-medium text-slate-400">Optional</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Join / Registration URL (`link`)
                  </label>
                  <div className="relative">
                    <LinkIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="url"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      placeholder="https://zoom.us/j/123456789"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 w-full">
                    <label className="block border-2 border-dashed border-slate-300 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/20 rounded-2xl p-5 text-center cursor-pointer transition-colors">
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
                      <Upload size={28} className="mx-auto text-purple-500 mb-1" />
                      <p className="text-xs font-semibold text-slate-700">Upload Hero Image Banner (`photo` / `event` binary)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">JPG or PNG image</p>
                    </label>
                  </div>

                  {photoPreview && (
                    <div className="relative w-44 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Complex Fields: features, roadMap, agendas, contactInfo */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2">
                  <Layers size={18} className="text-purple-600" />
                  Complex / Nested Data Arrays & Objects
                </span>
                <span className="text-xs font-medium text-slate-400">Serialized JSON Strings</span>
              </h2>

              {/* features */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  `features` (JSON String Array)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="e.g. Lunch Provided"
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-700"
                  >
                    Add Feature
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feat, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-xl text-xs"
                    >
                      <Tag size={12} className="text-purple-500" />
                      {feat}
                      <button type="button" onClick={() => removeFeature(i)} className="text-purple-400 hover:text-rose-600">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* roadMap */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  `roadMap` (JSON String Array of Steps)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <input
                    type="text"
                    placeholder="Title *"
                    value={newRoadmap.title}
                    onChange={(e) => setNewRoadmap({ ...newRoadmap, title: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Time (ISO / string)"
                    value={newRoadmap.time}
                    onChange={(e) => setNewRoadmap({ ...newRoadmap, time: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Time Taken (e.g. 30 mins)"
                    value={newRoadmap.timeTaken}
                    onChange={(e) => setNewRoadmap({ ...newRoadmap, timeTaken: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={newRoadmap.description}
                      onChange={(e) => setNewRoadmap({ ...newRoadmap, description: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={addRoadmap}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex-shrink-0"
                    >
                      Add Step
                    </button>
                  </div>
                </div>

                {formData.roadMap.map((step, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold text-purple-700">Step {step.step}: {step.title}</span>
                      {step.timeTaken && <span className="ml-2 text-slate-400 font-mono">({step.timeTaken})</span>}
                      {step.description && <p className="text-slate-600 mt-0.5">{step.description}</p>}
                    </div>
                    <button type="button" onClick={() => removeRoadmap(idx)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* agendas */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  `agendas` (JSON String Array)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <input
                    type="text"
                    placeholder="Time (e.g. 10:30 AM)"
                    value={newAgenda.time}
                    onChange={(e) => setNewAgenda({ ...newAgenda, time: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Title *"
                    value={newAgenda.title}
                    onChange={(e) => setNewAgenda({ ...newAgenda, title: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={newAgenda.description}
                      onChange={(e) => setNewAgenda({ ...newAgenda, description: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={addAgenda}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex-shrink-0"
                    >
                      Add Agenda
                    </button>
                  </div>
                </div>

                {formData.agendas.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold text-purple-700">{item.time || `Item ${idx + 1}`}: </span>
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      {item.description && <p className="text-slate-600 mt-0.5">{item.description}</p>}
                    </div>
                    <button type="button" onClick={() => removeAgenda(idx)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* contactInfo */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  `contactInfo` (JSON String Object)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="email"
                    name="email"
                    value={formData.contactInfo.email}
                    onChange={handleContactChange}
                    placeholder="email (e.g. events@example.com)"
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                  <input
                    type="text"
                    name="phone"
                    value={formData.contactInfo.phone}
                    onChange={handleContactChange}
                    placeholder="phone (e.g. +919876543210)"
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                  <input
                    type="text"
                    name="address"
                    value={formData.contactInfo.address}
                    onChange={handleContactChange}
                    placeholder="address (e.g. Building 4, Tech Park)"
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions Submit */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  <>
                    <Calendar size={18} />
                    POST /school/createEvent
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 border border-slate-200 hover:bg-slate-100 rounded-xl text-sm font-semibold text-slate-600 transition-colors"
                title="Reset form"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
