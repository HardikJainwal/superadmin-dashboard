'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Building,
  Building2,
  Search,
  RefreshCw,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { createEvent, getEvents, updateEvent, deleteEvent } from '@/lib/eventService';

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
  size: '',
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

// TODO: Switch back to 'https://api.humanova.live/api/v1' once backend is deployed
const API_BASE = 'http://192.168.29.196:3000/api/v1';

export default function CorporateEventsPage() {
  // Tab state: 'create' or 'manage'
  const [activeTab, setActiveTab] = useState('manage');

  // Create form state
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Events list state
  const [events, setEvents] = useState([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);

  // School selection state
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef(null);

  // Edit modal state
  const [editingEvent, setEditingEvent] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm state
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit modal builders state
  const [editNewFeature, setEditNewFeature] = useState('');
  const [editNewAgenda, setEditNewAgenda] = useState({ time: '', duration: '', title: '', description: '' });
  const [editNewRoadmap, setEditNewRoadmap] = useState({
    step: 1,
    time: '',
    title: '',
    description: '',
    timeTaken: ''
  });

  // Compute today's datetime-local min string (no past dates)
  const nowLocal = (() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  })();

  // Input builders state
  const [newFeature, setNewFeature] = useState('');
  const [newAgenda, setNewAgenda] = useState({ time: '', duration: '', title: '', description: '' });
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

  // Get token from localStorage
  const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem('corporate_token') ||
      localStorage.getItem('token') ||
      ''
    );
  };

  // ==================== FETCH SCHOOLS ====================
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

  const selectedSchool = schools.find((s) => s._id === selectedSchoolId);
  const selectedSchoolName = selectedSchool
    ? (selectedSchool.schoolName || selectedSchool.name || selectedSchool._id)
    : '';

  // ==================== FETCH EVENTS ====================
  const fetchEvents = useCallback(async (schoolId) => {
    const sid = schoolId !== undefined ? schoolId : selectedSchoolId;
    if (!sid) {
      setEvents([]);
      return;
    }
    setFetchingEvents(true);
    try {
      const result = await getEvents(sid);
      if (result.success && result.data) {
        const allEvents = [
          ...(result.data.localEvents || []),
          ...(result.data.globalEvents || [])
        ];
        setEvents(allEvents);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Fetch events error:', err);
      showToast('error', err.message || 'Failed to fetch events');
      setEvents([]);
    } finally {
      setFetchingEvents(false);
    }
  }, [showToast, selectedSchoolId]);

  // Load schools on mount
  useEffect(() => {
    fetchSchools();
  }, []);

  // Auto-fetch events when school is selected
  useEffect(() => {
    if (selectedSchoolId) {
      fetchEvents(selectedSchoolId);
    } else {
      setEvents([]);
    }
  }, [selectedSchoolId]);

  // ==================== DELETE EVENT ====================
  const handleDeleteEvent = async (eventId) => {
    setDeleteLoading(true);
    try {
      await deleteEvent(eventId);
      showToast('success', 'Event deleted successfully!');
      setDeletingEventId(null);
      fetchEvents();
    } catch (err) {
      console.error('Delete event error:', err);
      showToast('error', err.message || 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==================== EDIT EVENT ====================
  const openEditModal = (event) => {
    const startLocal = event.startTime ? toLocalDatetime(event.startTime) : '';
    const endLocal = event.endTime ? toLocalDatetime(event.endTime) : '';

    setEditFormData({
      title: event.title || '',
      description: event.description || '',
      type: event.type || 'physical',
      audience: event.audience || 'restricted',
      startTime: startLocal,
      endTime: endLocal,
      size: event.size ? String(event.size) : '',
      priceType: event.priceType || 'free',
      price: event.price ? String(event.price) : '',
      currency: event.currency || 'INR',
      location: event.location || '',
      link: event.link || '',
      photo: null,
      features: event.features || [],
      roadMap: (event.roadMap || []).map((item, idx) => ({
        step: item.step || idx + 1,
        time: item.time ? toLocalDatetime(item.time) : '',
        title: item.title || '',
        description: item.description || '',
        timeTaken: item.timeTaken || ''
      })),
      agendas: (event.agendas || []).map((item) => ({
        time: item.time || '',
        title: item.title || '',
        description: item.description || '',
        duration: item.duration || ''
      })),
      contactInfo: {
        email: event.contactInfo?.email || '',
        phone: event.contactInfo?.phone || '',
        address: event.contactInfo?.address || ''
      }
    });
    setEditingEvent(event);
    setEditPhotoPreview(event.photo?.[0] || null);
    setEditNewFeature('');
    setEditNewAgenda({ time: '', duration: '', title: '', description: '' });
    setEditNewRoadmap({ step: 1, time: '', title: '', description: '', timeTaken: '' });
  };

  const toLocalDatetime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60000);
      return local.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const handleEditSubmit = async () => {
    if (!editFormData.title.trim()) {
      showToast('error', 'Title is required');
      return;
    }

    setEditLoading(true);

    try {
      const data = new FormData();
      const orig = editingEvent;

      // Only append fields that changed
      if (editFormData.title.trim() !== (orig.title || '')) {
        data.append('title', editFormData.title.trim());
      }
      if (editFormData.description.trim() !== (orig.description || '')) {
        data.append('description', editFormData.description.trim());
      }
      if (editFormData.type !== (orig.type || 'physical')) {
        data.append('type', editFormData.type);
      }
      if (editFormData.audience !== (orig.audience || 'restricted')) {
        data.append('audience', editFormData.audience);
      }

      const origStart = orig.startTime ? toLocalDatetime(orig.startTime) : '';
      const origEnd = orig.endTime ? toLocalDatetime(orig.endTime) : '';
      if (editFormData.startTime && editFormData.startTime !== origStart) {
        data.append('startTime', editFormData.startTime);
      }
      if (editFormData.endTime && editFormData.endTime !== origEnd) {
        data.append('endTime', editFormData.endTime);
      }

      if (editFormData.size !== String(orig.size || '')) {
        data.append('size', editFormData.size);
      }
      if (editFormData.priceType !== (orig.priceType || 'free')) {
        data.append('priceType', editFormData.priceType);
      }
      if (editFormData.priceType === 'paid') {
        if (editFormData.price !== String(orig.price || '')) {
          data.append('price', editFormData.price);
        }
        if (editFormData.currency !== (orig.currency || 'INR')) {
          data.append('currency', editFormData.currency);
        }
      }
      if (editFormData.location.trim() !== (orig.location || '')) {
        data.append('location', editFormData.location.trim());
      }
      if (editFormData.link?.trim() !== (orig.link || '')) {
        data.append('link', editFormData.link.trim());
      }

      // Photo — always send if a new file was picked
      if (editFormData.photo) {
        data.append('photo', editFormData.photo);
      }

      // Features — compare as JSON
      const finalFeatures = [...(editFormData.features || [])];
      if (editNewFeature.trim()) finalFeatures.push(editNewFeature.trim());
      if (JSON.stringify(finalFeatures) !== JSON.stringify(orig.features || [])) {
        data.append('features', JSON.stringify(finalFeatures));
      }

      // Roadmap — compare as JSON
      const finalRoadMap = [...(editFormData.roadMap || [])];
      if (editNewRoadmap.title.trim()) {
        finalRoadMap.push({
          step: finalRoadMap.length + 1,
          time: editNewRoadmap.time.trim(),
          title: editNewRoadmap.title.trim(),
          description: editNewRoadmap.description.trim(),
          timeTaken: editNewRoadmap.timeTaken.trim()
        });
      }
      const origRoadMap = (orig.roadMap || []).map((item, idx) => ({
        step: item.step || idx + 1,
        time: item.time ? toLocalDatetime(item.time) : '',
        title: item.title || '',
        description: item.description || '',
        timeTaken: item.timeTaken || ''
      }));
      if (JSON.stringify(finalRoadMap) !== JSON.stringify(origRoadMap)) {
        data.append('roadMap', JSON.stringify(finalRoadMap));
      }

      // Agendas — compare as JSON
      const finalAgendas = [...(editFormData.agendas || [])];
      if (editNewAgenda.title.trim()) {
        finalAgendas.push({
          time: editNewAgenda.time.trim(),
          duration: editNewAgenda.duration.trim(),
          title: editNewAgenda.title.trim(),
          description: editNewAgenda.description.trim()
        });
      }
      const origAgendas = (orig.agendas || []).map((item) => ({
        time: item.time || '',
        title: item.title || '',
        description: item.description || '',
        duration: item.duration || ''
      }));
      if (JSON.stringify(finalAgendas) !== JSON.stringify(origAgendas)) {
        data.append('agendas', JSON.stringify(finalAgendas));
      }

      // Contact Info — compare as JSON
      const origContact = {
        email: orig.contactInfo?.email || '',
        phone: orig.contactInfo?.phone || '',
        address: orig.contactInfo?.address || ''
      };
      if (JSON.stringify(editFormData.contactInfo) !== JSON.stringify(origContact)) {
        data.append('contactInfo', JSON.stringify(editFormData.contactInfo));
      }

      // Check if anything actually changed
      let hasChanges = false;
      for (const _ of data.entries()) { hasChanges = true; break; }
      if (!hasChanges) {
        showToast('error', 'No changes detected');
        setEditLoading(false);
        return;
      }

      await updateEvent(editingEvent.id || editingEvent._id, data);
      showToast('success', 'Event updated successfully!');
      setEditingEvent(null);
      setEditFormData(null);
      fetchEvents();
    } catch (err) {
      console.error('Update event error:', err);
      showToast('error', err.message || 'Failed to update event');
    } finally {
      setEditLoading(false);
    }
  };

  // ==================== CREATE FORM HANDLERS ====================
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

  // Features builder & updater
  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeature.trim()]
    }));
    setNewFeature('');
  };

  const updateFeature = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.features];
      updated[index] = value;
      return { ...prev, features: updated };
    });
  };

  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Agendas builder & updater
  const addAgenda = () => {
    if (!newAgenda.title.trim()) {
      showToast('error', 'Agenda item requires at least a title');
      return;
    }
    if (newAgenda.time.trim()) {
      const agendaDate = new Date(newAgenda.time);
      if (!isNaN(agendaDate.getTime()) && agendaDate < new Date()) {
        showToast('error', 'Agenda date & time cannot be in the past');
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      agendas: [...prev.agendas, { ...newAgenda }]
    }));
    setNewAgenda({ time: '', duration: '', title: '', description: '' });
  };

  const updateAgenda = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.agendas];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, agendas: updated };
    });
  };

  const removeAgenda = (index) => {
    setFormData((prev) => ({
      ...prev,
      agendas: prev.agendas.filter((_, i) => i !== index)
    }));
  };

  // Roadmap builder & updater
  const addRoadmap = () => {
    if (!newRoadmap.title.trim()) {
      showToast('error', 'Roadmap item requires a title');
      return;
    }
    if (!newRoadmap.time.trim()) {
      showToast('error', 'Roadmap step requires a valid Date & Time');
      return;
    }
    const stepDate = new Date(newRoadmap.time);
    if (!isNaN(stepDate.getTime()) && stepDate < new Date()) {
      showToast('error', 'Roadmap step date & time cannot be in the past');
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

  const updateRoadmap = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.roadMap];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, roadMap: updated };
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
    if (new Date(formData.startTime) < new Date()) {
      showToast('error', 'Event Start Time cannot be in the past');
      return;
    }
    if (!formData.endTime) {
      showToast('error', 'End Time is required');
      return;
    }
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      showToast('error', 'End Time must be after Start Time');
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
    if (!formData.link || !formData.link.trim()) {
      showToast('error', 'Event Join / Registration Link is required');
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

      // Stringified JSON fields - append when non-empty, auto-capturing any pending input field
      const finalFeatures = [...(formData.features || [])];
      if (newFeature.trim()) {
        finalFeatures.push(newFeature.trim());
      }
      if (finalFeatures.length > 0) {
        data.append('features', JSON.stringify(finalFeatures));
      }

      const finalRoadMap = [...(formData.roadMap || [])];
      if (newRoadmap.title.trim()) {
        finalRoadMap.push({
          step: finalRoadMap.length + 1,
          time: newRoadmap.time.trim(),
          title: newRoadmap.title.trim(),
          description: newRoadmap.description.trim(),
          timeTaken: newRoadmap.timeTaken.trim()
        });
      }
      if (finalRoadMap.length > 0) {
        // Enforce no past date/time for roadmap steps
        for (const item of finalRoadMap) {
          if (item.time) {
            const stepD = new Date(item.time);
            if (!isNaN(stepD.getTime()) && stepD < new Date()) {
              showToast('error', `Roadmap step "${item.title || 'Step'}" date & time cannot be in the past`);
              setLoading(false);
              return;
            }
          }
        }
        const cleanedRoadMap = finalRoadMap.map((item, idx) => {
          let timeVal = item.time ? String(item.time).trim() : '';
          // If time is only hh:mm without a date (e.g. "10:00"), auto-combine with start date or today's date
          if (timeVal && !timeVal.includes('-') && timeVal.includes(':')) {
            const baseDate = formData.startTime ? formData.startTime.split('T')[0] : new Date().toISOString().split('T')[0];
            timeVal = `${baseDate}T${timeVal}`;
          }
          return {
            step: Number(item.step) || idx + 1,
            time: timeVal,
            title: item.title ? String(item.title).trim() : '',
            description: item.description ? String(item.description).trim() : '',
            timeTaken: item.timeTaken ? String(item.timeTaken).trim() : ''
          };
        });
        data.append('roadMap', JSON.stringify(cleanedRoadMap));
      }

      const finalAgendas = [...(formData.agendas || [])];
      if (newAgenda.title.trim()) {
        finalAgendas.push({
          time: newAgenda.time.trim(),
          duration: newAgenda.duration.trim(),
          title: newAgenda.title.trim(),
          description: newAgenda.description.trim()
        });
      }
      if (finalAgendas.length > 0) {
        // Enforce no past date/time for agendas if date/time is specified
        for (const item of finalAgendas) {
          if (item.time) {
            const agendaD = new Date(item.time);
            if (!isNaN(agendaD.getTime()) && agendaD < new Date()) {
              showToast('error', `Agenda item "${item.title || 'Agenda'}" date & time cannot be in the past`);
              setLoading(false);
              return;
            }
          }
        }
        const cleanedAgendas = finalAgendas.map((item) => ({
          time: item.time ? String(item.time).trim() : '',
          title: item.title ? String(item.title).trim() : '',
          description: item.description ? String(item.description).trim() : '',
          duration: item.duration ? String(item.duration).trim() : ''
        }));
        data.append('agendas', JSON.stringify(cleanedAgendas));
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
      fetchEvents(); // Refresh the list
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
    setNewFeature('');
    setNewAgenda({ time: '', title: '', description: '' });
    setNewRoadmap({ step: 1, time: '', title: '', description: '', timeTaken: '' });
  };

  // ==================== HELPERS ====================
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  const getEventStatusColor = (event) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (now >= start && now <= end) return { label: 'Live', color: 'bg-emerald-100 text-emerald-700' };
    return { label: 'Ended', color: 'bg-slate-100 text-slate-500' };
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

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                <Calendar size={26} />
              </div>
              Event Management
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              Create, view, edit, and delete events
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('manage'); fetchEvents(); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'manage'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Eye size={16} />
              Manage Events
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Plus size={16} />
              Create Event
            </button>
          </div>
        </div>

        {/* ==================== MANAGE EVENTS TAB ==================== */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {/* Sub-header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-600" />
                    All Events ({events.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Select a school to view, edit, or remove its events</p>
                </div>
                <button
                  onClick={() => fetchEvents(selectedSchoolId)}
                  disabled={fetchingEvents || !selectedSchoolId}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={fetchingEvents ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {/* School Selector */}
              <div className="relative" ref={schoolDropdownRef}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select School <span className="text-rose-500">*</span>
                  {schools.length > 0 && (
                    <span className="text-xs font-normal text-slate-400 ml-2">({schools.length} available)</span>
                  )}
                </label>

                {schoolsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <RefreshCw size={14} className="animate-spin text-purple-500" />
                    Loading schools...
                  </div>
                ) : selectedSchoolId && !isSchoolDropdownOpen ? (
                  <div className="flex items-center justify-between w-full px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 size={16} className="text-purple-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-slate-800 truncate">{selectedSchoolName}</span>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">({selectedSchoolId.slice(-8)})</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => { setIsSchoolDropdownOpen(true); setSchoolSearch(''); }}
                        className="p-1 hover:bg-purple-100 rounded-lg transition-colors text-slate-400 hover:text-purple-600"
                        title="Change school"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedSchoolId(''); setSchoolSearch(''); setEvents([]); }}
                        className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-slate-400 hover:text-rose-500"
                        title="Clear selection"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={schoolSearch}
                        onChange={(e) => { setSchoolSearch(e.target.value); setIsSchoolDropdownOpen(true); }}
                        onFocus={() => setIsSchoolDropdownOpen(true)}
                        placeholder="Search schools by name or ID..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none text-slate-800"
                        autoComplete="off"
                      />
                    </div>

                    {isSchoolDropdownOpen && (
                      <div className="absolute z-[60] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredSchools.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-400 text-center">
                            {schoolSearch ? 'No schools match your search' : 'No schools found'}
                          </div>
                        ) : (
                          filteredSchools.map((school) => (
                            <button
                              key={school._id}
                              type="button"
                              onClick={() => {
                                setSelectedSchoolId(school._id);
                                setSchoolSearch('');
                                setIsSchoolDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors flex items-center justify-between group ${
                                selectedSchoolId === school._id ? 'bg-purple-50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Building2 size={14} className="text-slate-400 group-hover:text-purple-600 flex-shrink-0" />
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
            </div>

            {/* Loading */}
            {fetchingEvents && events.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">Fetching events...</p>
              </div>
            )}

            {/* Empty — no school selected */}
            {!fetchingEvents && !selectedSchoolId && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16 text-center">
                <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-base font-semibold text-slate-600">Select a school to view events</p>
                <p className="text-xs text-slate-400 mt-1">Choose a school from the dropdown above</p>
              </div>
            )}

            {/* Empty — school selected but no events */}
            {!fetchingEvents && selectedSchoolId && events.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16 text-center">
                <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-base font-semibold text-slate-600">No events found for this school</p>
                <p className="text-xs text-slate-400 mt-1">Create your first event to get started</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Create Event
                </button>
              </div>
            )}

            {/* Event Cards */}
            {events.length > 0 && (
              <div className="space-y-4">
                {events.map((event) => {
                  const eventId = event.id || event._id;
                  const isExpanded = expandedEventId === eventId;
                  const status = getEventStatusColor(event);
                  const eventPhoto = event.photo?.[0] || null;

                  return (
                    <div
                      key={eventId}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Card Header */}
                      <div className="p-5 flex flex-col md:flex-row gap-4">
                        {/* Photo Thumbnail */}
                        {eventPhoto && (
                          <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={eventPhoto}
                              alt={event.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-slate-800 truncate">{event.title}</h3>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${status.color}`}>
                                {status.label}
                              </span>
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                event.type === 'virtual' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {event.type === 'virtual' ? '🌐 Virtual' : '🏢 Physical'}
                              </span>
                            </div>
                          </div>

                          {/* Quick Info Row */}
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-purple-500" />
                              {formatDate(event.startTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-rose-500" />
                              {event.location || '—'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={12} className="text-blue-500" />
                              {event.bookedSlots || 0}/{event.size || '—'} slots
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              event.priceType === 'paid'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {event.priceType === 'paid' ? `${event.currency} ${event.price}` : 'Free'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setExpandedEventId(isExpanded ? null : eventId)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Collapse' : 'View Details'}
                        </button>

                        <div className="flex items-center gap-2">
                          {event.link && (
                            <a
                              href={event.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <ExternalLink size={12} />
                              Link
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(event)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingEventId(eventId)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                          {/* Schedule */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl p-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Start Time</p>
                              <p className="text-xs font-medium text-slate-700">{formatDate(event.startTime)}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">End Time</p>
                              <p className="text-xs font-medium text-slate-700">{formatDate(event.endTime)}</p>
                            </div>
                          </div>

                          {/* Features */}
                          {event.features && event.features.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Features</p>
                              <div className="flex flex-wrap gap-2">
                                {event.features.map((feat, i) => (
                                  <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[11px] font-medium rounded-full">
                                    {feat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Roadmap */}
                          {event.roadMap && event.roadMap.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Roadmap / Timeline</p>
                              <div className="space-y-2">
                                {event.roadMap.map((item, i) => (
                                  <div key={i} className="flex gap-3 bg-slate-50 rounded-lg p-3 text-xs">
                                    <span className="font-bold text-purple-600 flex-shrink-0">Step {item.step || i + 1}</span>
                                    <div>
                                      <p className="font-semibold text-slate-700">{item.title}</p>
                                      {item.description && <p className="text-slate-500 mt-0.5">{item.description}</p>}
                                      {item.timeTaken && <p className="text-slate-400 mt-0.5">Duration: {item.timeTaken}</p>}
                                      {item.time && <p className="text-slate-400 mt-0.5">{formatDate(item.time)}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Agendas */}
                          {event.agendas && event.agendas.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Agendas</p>
                              <div className="space-y-2">
                                {event.agendas.map((item, i) => (
                                  <div key={i} className="flex gap-3 bg-slate-50 rounded-lg p-3 text-xs">
                                    <span className="font-bold text-purple-600 flex-shrink-0">{item.time || `#${i + 1}`}</span>
                                    <div>
                                      <p className="font-semibold text-slate-700">{item.title}</p>
                                      {item.description && <p className="text-slate-500 mt-0.5">{item.description}</p>}
                                      {item.duration && <p className="text-slate-400 mt-0.5 text-[10px]">Duration: {item.duration}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contact Info */}
                          {event.contactInfo && (event.contactInfo.email || event.contactInfo.phone || event.contactInfo.address) && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Contact Info</p>
                              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                                {event.contactInfo.email && <span>📧 {event.contactInfo.email}</span>}
                                {event.contactInfo.phone && <span>📱 {event.contactInfo.phone}</span>}
                                {event.contactInfo.address && <span>📍 {event.contactInfo.address}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== CREATE EVENT TAB ==================== */}
        {activeTab === 'create' && (
          <>
            {/* Success View */}
            {createdEvent ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Event Created Successfully!</h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  Event <strong className="text-slate-800">&quot;{formData.title}&quot;</strong> has been published and is now active.
                </p>

                <div className="flex gap-3 justify-center pt-4">
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors"
                  >
                    <Plus size={16} />
                    Create Another Event
                  </button>
                  <button
                    onClick={() => { resetForm(); setActiveTab('manage'); fetchEvents(); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Eye size={16} />
                    View Events
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Core Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <FileText size={18} className="text-purple-600" />
                      Event Details
                    </h2>
                    <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
                      Required
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
                        placeholder="Enter event title"
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
                        placeholder="Describe your event in detail..."
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
                        Capacity / Max Slots <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Users size={16} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          name="size"
                          value={formData.size}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^[0-9]+$/.test(val)) {
                              handleInputChange({ target: { name: "size", value: val } });
                            }
                          }}
                          placeholder="Max capacity (e.g., 100)"
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
                        min={nowLocal}
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
                        min={formData.startTime || nowLocal}
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
                              ? 'Event venue / address'
                              : 'Virtual meeting link or room name'
                          }
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Pricing Logic */}
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
                            placeholder="Enter ticket price"
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

                {/* Section 3: Photo & Link */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="flex items-center gap-2">
                      <Upload size={18} className="text-purple-600" />
                      Media & Event Link
                    </span>
                    <span className="text-xs font-medium text-slate-400">Optional</span>
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Event Join / Registration Link <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <LinkIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="url"
                          name="link"
                          value={formData.link}
                          onChange={handleInputChange}
                          placeholder="https://example.com/event-registration"
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 w-full">
                        <label className="block border-2 border-dashed border-slate-300 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/20 rounded-2xl p-5 text-center cursor-pointer transition-colors">
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
                          <Upload size={28} className="mx-auto text-purple-500 mb-1" />
                          <p className="text-xs font-semibold text-slate-700">Upload Event Banner Image</p>
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

                {/* Section 4: Features, Roadmap & Agendas */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="flex items-center gap-2">
                      <Layers size={18} className="text-purple-600" />
                      Features, Roadmap & Agendas
                    </span>
                    <span className="text-xs font-medium text-slate-400">Optional</span>
                  </h2>

                  {/* features */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Features
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="e.g., Refreshments Provided"
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
                    <div className="space-y-2">
                      {formData.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Tag size={14} className="text-purple-500 flex-shrink-0" />
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => updateFeature(i, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <button type="button" onClick={() => removeFeature(i)} className="text-slate-400 hover:text-rose-600 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* roadMap */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Roadmap / Timeline
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <input
                        type="datetime-local"
                        min={nowLocal}
                        value={newRoadmap.time}
                        onChange={(e) => setNewRoadmap({ ...newRoadmap, time: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g., 30 mins)"
                        value={newRoadmap.timeTaken}
                        onChange={(e) => setNewRoadmap({ ...newRoadmap, timeTaken: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Title *"
                        value={newRoadmap.title}
                        onChange={(e) => setNewRoadmap({ ...newRoadmap, title: e.target.value })}
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

                    {formData.roadMap.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-purple-700">Step {item.step || idx + 1}</span>
                          <button type="button" onClick={() => removeRoadmap(idx)} className="text-slate-400 hover:text-rose-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="datetime-local"
                            min={nowLocal}
                            value={item.time}
                            onChange={(e) => updateRoadmap(idx, 'time', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Duration (e.g., 30 mins)"
                            value={item.timeTaken}
                            onChange={(e) => updateRoadmap(idx, 'timeTaken', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Title"
                          value={item.title}
                          onChange={(e) => updateRoadmap(idx, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold"
                        />
                        <textarea
                          rows="2"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateRoadmap(idx, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* agendas */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Agendas / Schedule
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <input
                        type="text"
                        placeholder="Time (e.g., 9:00 AM)"
                        value={newAgenda.time}
                        onChange={(e) => setNewAgenda({ ...newAgenda, time: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g., 30 mins)"
                        value={newAgenda.duration}
                        onChange={(e) => setNewAgenda({ ...newAgenda, duration: e.target.value })}
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
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-purple-700">Agenda {idx + 1}</span>
                          <button type="button" onClick={() => removeAgenda(idx)} className="text-slate-400 hover:text-rose-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Time"
                            value={item.time}
                            onChange={(e) => updateAgenda(idx, 'time', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={item.duration || ''}
                            onChange={(e) => updateAgenda(idx, 'duration', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Title"
                            value={item.title}
                            onChange={(e) => updateAgenda(idx, 'title', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold"
                          />
                        </div>
                        <textarea
                          rows="2"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateAgenda(idx, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* contactInfo */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Contact Information
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="email"
                        name="email"
                        value={formData.contactInfo.email}
                        onChange={handleContactChange}
                        placeholder="Email (e.g., contact@example.com)"
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      />
                      <input
                        type="text"
                        name="phone"
                        value={formData.contactInfo.phone}
                        onChange={handleContactChange}
                        placeholder="Phone (e.g., +91 9876543210)"
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      />
                      <input
                        type="text"
                        name="address"
                        value={formData.contactInfo.address}
                        onChange={handleContactChange}
                        placeholder="Address (e.g., Tech Park)"
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
                        Create Event
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
          </>
        )}
      </div>

      {/* ==================== DELETE CONFIRM MODAL ==================== */}
      {deletingEventId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center">Delete Event?</h3>
            <p className="text-sm text-slate-500 text-center">
              This action cannot be undone. The event will be permanently removed.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingEventId(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(deletingEventId)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT EVENT MODAL ==================== */}
      {editingEvent && editFormData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 space-y-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Edit3 size={20} className="text-blue-600" />
                  Edit Event
                </h2>
                <button
                  onClick={() => { setEditingEvent(null); setEditFormData(null); }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Event Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditFormData(prev => ({ ...prev, type: 'physical' }))}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      editFormData.type === 'physical'
                        ? 'bg-purple-50 border-purple-600 text-purple-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building size={16} /> Physical
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData(prev => ({ ...prev, type: 'virtual' }))}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      editFormData.type === 'virtual'
                        ? 'bg-purple-50 border-purple-600 text-purple-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Globe size={16} /> Virtual
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Title *</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Start/End Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Size & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Capacity</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editFormData.size}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^[0-9]+$/.test(val)) {
                        setEditFormData(prev => ({ ...prev, size: val }));
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Price Type</label>
                  <select
                    value={editFormData.priceType}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, priceType: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                {editFormData.priceType === 'paid' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Price</label>
                      <input
                        type="number"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Currency</label>
                      <select
                        value={editFormData.currency}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Event Link</label>
                <input
                  type="url"
                  value={editFormData.link}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, link: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Update Photo</label>
                <div className="flex items-center gap-4">
                  {editPhotoPreview && (
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editPhotoPreview} alt="Current" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="flex-1 block border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 rounded-xl p-3 text-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditFormData(prev => ({ ...prev, photo: file }));
                          setEditPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <Upload size={18} className="mx-auto text-blue-500 mb-1" />
                    <p className="text-[11px] text-slate-500">Click to upload new image</p>
                  </label>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Features</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editNewFeature}
                    onChange={(e) => setEditNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editNewFeature.trim()) {
                        setEditFormData(prev => ({ ...prev, features: [...prev.features, editNewFeature.trim()] }));
                        setEditNewFeature('');
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editFormData.features.map((feat, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-[11px] font-medium rounded-full">
                      {feat}
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }))}
                        className="text-purple-400 hover:text-rose-500"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Roadmap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Roadmap / Timeline</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-2">
                  <input
                    type="datetime-local"
                    value={editNewRoadmap.time}
                    onChange={(e) => setEditNewRoadmap(prev => ({ ...prev, time: e.target.value }))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                    placeholder="Date & Time"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g., 30 mins)"
                    value={editNewRoadmap.timeTaken}
                    onChange={(e) => setEditNewRoadmap(prev => ({ ...prev, timeTaken: e.target.value }))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Title *"
                    value={editNewRoadmap.title}
                    onChange={(e) => setEditNewRoadmap(prev => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={editNewRoadmap.description}
                      onChange={(e) => setEditNewRoadmap(prev => ({ ...prev, description: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!editNewRoadmap.title.trim()) return;
                        setEditFormData(prev => ({
                          ...prev,
                          roadMap: [...prev.roadMap, {
                            step: prev.roadMap.length + 1,
                            time: editNewRoadmap.time,
                            title: editNewRoadmap.title.trim(),
                            description: editNewRoadmap.description.trim(),
                            timeTaken: editNewRoadmap.timeTaken.trim()
                          }]
                        }));
                        setEditNewRoadmap({ step: 1, time: '', title: '', description: '', timeTaken: '' });
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex-shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {editFormData.roadMap.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-purple-700">Step {item.step || idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setEditFormData(prev => ({
                            ...prev,
                            roadMap: prev.roadMap.filter((_, i) => i !== idx).map((item, i) => ({ ...item, step: i + 1 }))
                          }))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="datetime-local"
                          value={item.time}
                          onChange={(e) => setEditFormData(prev => {
                            const updated = [...prev.roadMap];
                            updated[idx] = { ...updated[idx], time: e.target.value };
                            return { ...prev, roadMap: updated };
                          })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={item.timeTaken}
                          onChange={(e) => setEditFormData(prev => {
                            const updated = [...prev.roadMap];
                            updated[idx] = { ...updated[idx], timeTaken: e.target.value };
                            return { ...prev, roadMap: updated };
                          })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Title"
                        value={item.title}
                        onChange={(e) => setEditFormData(prev => {
                          const updated = [...prev.roadMap];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          return { ...prev, roadMap: updated };
                        })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold"
                      />
                      <textarea
                        rows="2"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => setEditFormData(prev => {
                          const updated = [...prev.roadMap];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          return { ...prev, roadMap: updated };
                        })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Agendas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Agendas / Schedule</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-2">
                  <input
                    type="text"
                    placeholder="Time (e.g., 9:00 AM)"
                    value={editNewAgenda.time}
                    onChange={(e) => setEditNewAgenda(prev => ({ ...prev, time: e.target.value }))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g., 30 mins)"
                    value={editNewAgenda.duration}
                    onChange={(e) => setEditNewAgenda(prev => ({ ...prev, duration: e.target.value }))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Title *"
                    value={editNewAgenda.title}
                    onChange={(e) => setEditNewAgenda(prev => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={editNewAgenda.description}
                      onChange={(e) => setEditNewAgenda(prev => ({ ...prev, description: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!editNewAgenda.title.trim()) return;
                        setEditFormData(prev => ({
                          ...prev,
                          agendas: [...prev.agendas, {
                            time: editNewAgenda.time.trim(),
                            duration: editNewAgenda.duration.trim(),
                            title: editNewAgenda.title.trim(),
                            description: editNewAgenda.description.trim()
                          }]
                        }));
                        setEditNewAgenda({ time: '', duration: '', title: '', description: '' });
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex-shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {editFormData.agendas.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-purple-700">Agenda {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setEditFormData(prev => ({
                            ...prev,
                            agendas: prev.agendas.filter((_, i) => i !== idx)
                          }))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Time"
                          value={item.time}
                          onChange={(e) => setEditFormData(prev => {
                            const updated = [...prev.agendas];
                            updated[idx] = { ...updated[idx], time: e.target.value };
                            return { ...prev, agendas: updated };
                          })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={item.duration || ''}
                          onChange={(e) => setEditFormData(prev => {
                            const updated = [...prev.agendas];
                            updated[idx] = { ...updated[idx], duration: e.target.value };
                            return { ...prev, agendas: updated };
                          })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Title"
                          value={item.title}
                          onChange={(e) => setEditFormData(prev => {
                            const updated = [...prev.agendas];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            return { ...prev, agendas: updated };
                          })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold"
                        />
                      </div>
                      <textarea
                        rows="2"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => setEditFormData(prev => {
                          const updated = [...prev.agendas];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          return { ...prev, agendas: updated };
                        })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Contact Info</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="email"
                    value={editFormData.contactInfo.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))}
                    placeholder="Email"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={editFormData.contactInfo.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, phone: e.target.value } }))}
                    placeholder="Phone"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={editFormData.contactInfo.address}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, address: e.target.value } }))}
                    placeholder="Address"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleEditSubmit}
                  disabled={editLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50"
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setEditingEvent(null); setEditFormData(null); }}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-sm font-semibold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
