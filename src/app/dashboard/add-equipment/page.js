
'use client'

import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Plus, Package, Settings, ChevronDown, Check, X, Upload, Image as ImageIcon } from 'lucide-react'
import { apiClient } from '@/lib/api'
import * as XLSX from 'xlsx'

export default function EquipmentAdminPanel() {
  const [activeTab, setActiveTab] = useState('equipment')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const bulkFileRef = useRef(null)
  
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [equipmentForm, setEquipmentForm] = useState({
    category_id: '',
    name: '',
    brand_name: '',
    model: '',
    description: '',
    key_features: [],
    weight: { value: '', unit: 'kg' },
    height: { value: '', unit: 'cm' },
    plans: [],
    images: [],
    availability_status: 'available',
    is_active: true
  });
  
  const [newKeyFeature, setNewKeyFeature] = useState('')
  const [newPlan, setNewPlan] = useState({
    name: '',
    duration: '',
    price: '',
    currency: 'INR',
    features: []
  })
  const [newPlanFeature, setNewPlanFeature] = useState('')
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    filters: []
  })
  const [newFilter, setNewFilter] = useState('')
  
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const showNotification = (message, type = 'success') => {
    const id = Date.now()
    const notification = { id, message, type }
    setNotifications(prev => [...prev, notification])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 4000)
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/equipment-categories?limit=100&page=1')
      if (data.success) {
        setCategories(data.data.data || [])
      }
    } catch (error) {
      showNotification('Failed to fetch categories', 'error')
      console.error('Fetch categories error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const payload = {
        name: categoryForm.name,
        ...(categoryForm.filters.length > 0 && { filters: categoryForm.filters })
      }

      const data = await apiClient.post('/equipment-categories', payload)
      
      if (data.success) {
        showNotification('Category created successfully!')
        setCategoryForm({ name: '', filters: [] })
        fetchCategories()
      } else {
        showNotification(data.message || 'Failed to create category', 'error')
      }
    } catch (error) {
      showNotification(error.message || 'Network error occurred', 'error')
      console.error('Create category error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const validFiles = files.filter(file => validTypes.includes(file.type))
    
    if (validFiles.length !== files.length) {
      showNotification('Some files were skipped. Only JPEG, PNG, GIF, and WebP images are allowed.', 'error')
    }
    
    const oversizedFiles = validFiles.filter(file => file.size > 2 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      showNotification('Some files are too large. Maximum size is 2MB per image before compression.', 'error')
      return
    }
    
    const currentImageCount = equipmentForm.images?.length || 0
    const newImageCount = validFiles.length
    
   if (currentImageCount + newImageCount > 10) {
      const allowedCount = 10 - currentImageCount
      const filesToAdd = validFiles.slice(0, allowedCount)
      
      setEquipmentForm(prev => ({
        ...prev,
        images: [...prev.images, ...filesToAdd]
      }))
      
      showNotification(`Only ${allowedCount} images were added due to the 10-image limit.`, 'error')
    } else {
      setEquipmentForm(prev => ({
        ...prev,
        images: [...prev.images, ...validFiles]
      }))
      
      showNotification(`${validFiles.length} image(s) added successfully!`)
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (indexToRemove) => {
    setEquipmentForm(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const createEquipment = async (e) => {
    e.preventDefault();
    console.log('=== STARTING EQUIPMENT CREATION ===');

    if (!selectedCategory) {
      console.error('❌ No category selected');
      showNotification('Please select a category', 'error');
      return;
    }

    console.log('✅ Selected category:', selectedCategory);
    console.log('📋 Equipment form data:', equipmentForm);

    try {
      setLoading(true);
      console.log('🔄 Loading started');

      const formData = new FormData();
      console.log('📦 FormData object created');

      console.log('➕ Adding basic fields...');
      formData.append('category_id', selectedCategory.id);
      console.log('  category_id:', selectedCategory.id);
      
      formData.append('name', equipmentForm.name);
      console.log('  name:', equipmentForm.name);
      
      if (equipmentForm.brand_name) {
        formData.append('brand_name', equipmentForm.brand_name);
        console.log('  brand_name:', equipmentForm.brand_name);
      }
      
      formData.append('model', equipmentForm.model);
      console.log('  model:', equipmentForm.model);
      
      formData.append('description', equipmentForm.description);
      console.log('  description length:', equipmentForm.description.length);

      console.log('➕ Processing key features...');
      console.log('  key_features array:', equipmentForm.key_features);
      if (equipmentForm.key_features.length > 0) {
        equipmentForm.key_features.forEach((feature, index) => {
          formData.append('key_features[]', feature);
          console.log(`  key_features[${index}]:`, feature);
        });
      } else {
        console.log('  No key features to add');
      }

      console.log('➕ Processing weight...');
      if (equipmentForm.weight.value) {
        formData.append(
          'weight',
          JSON.stringify({
            value: parseFloat(equipmentForm.weight.value),
            unit: equipmentForm.weight.unit,
          })
        );
        console.log('  weight object:', {
          value: equipmentForm.weight.value,
          unit: equipmentForm.weight.unit,
        });
      } else {
        console.log('  No weight to add');
      }

      console.log('➕ Processing height...');
      if (equipmentForm.height.value) {
        formData.append(
          'height',
          JSON.stringify({
            value: parseFloat(equipmentForm.height.value),
            unit: equipmentForm.height.unit,
          })
        );
        console.log('  height object:', {
          value: equipmentForm.height.value,
          unit: equipmentForm.height.unit,
        });
      } else {
        console.log('  No height to add');
      }

      console.log('➕ Processing plans...');
      console.log('  plans array:', equipmentForm.plans);
      if (equipmentForm.plans.length > 0) {
        equipmentForm.plans.forEach((plan, index) => {
          const planJson = JSON.stringify(plan);
          formData.append('plans[]', planJson);
          console.log(`  plans[${index}]:`, planJson);
        });
      } else {
        console.log('  No plans to add');
      }

      console.log('➕ Processing images...');
      console.log('  images array length:', equipmentForm.images.length);
      if (equipmentForm.images.length > 0) {
        equipmentForm.images.forEach((image, index) => {
          formData.append('links', image);
          console.log(`  image[${index}]:`, {
            name: image.name,
            size: image.size,
            type: image.type,
            lastModified: image.lastModified
          });
        });
      } else {
        console.log('  No images to add');
      }

      console.log('➕ Adding status fields...');
      formData.append('availability_status', equipmentForm.availability_status);
      console.log('  availability_status:', equipmentForm.availability_status);
      
      formData.append('is_active', equipmentForm.is_active ? 'true' : 'false');
      console.log('  is_active:', equipmentForm.is_active ? 'true' : 'false');

      console.log('📋 COMPLETE FormData contents:');
      let formDataEntries = [];
      for (let [key, value] of formData.entries()) {
        const entry = {
          key: key,
          value: value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value,
          type: value instanceof File ? 'File' : typeof value
        };
        formDataEntries.push(entry);
        console.log(`  ${key}:`, entry.value, `(${entry.type})`);
      }

      console.log('📊 FormData summary:', {
        totalEntries: formDataEntries.length,
        fileCount: formDataEntries.filter(e => e.type === 'File').length,
        textCount: formDataEntries.filter(e => e.type === 'string').length
      });

      console.log('🌐 Making API request...');
      console.log('  URL: /equipment');
      console.log('  Method: POST');
      console.log('  Body type: FormData');
      
      const data = await apiClient.post('/equipment', formData);
      console.log('✅ API response received:', data);

      if (data.success) {
        console.log('🎉 Equipment created successfully!');
        showNotification('Equipment created successfully!');
        setEquipmentForm({
          category_id: '',
          name: '',
          brand_name: '',
          model: '',
          description: '',
          key_features: [],
          weight: { value: '', unit: 'kg' },
          height: { value: '', unit: 'cm' },
          plans: [],
          images: [],
          availability_status: 'available',
          is_active: true,
        });
        setSelectedCategory(null);
        console.log('🔄 Form reset completed');
      } else {
        console.error('❌ API returned success: false');
        console.error('Response data:', data);
        showNotification(data.message || 'Failed to create equipment', 'error');
      }
    } catch (error) {
      console.error('💥 CREATION ERROR OCCURRED:');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      showNotification(error.message || 'Network error occurred', 'error');
    } finally {
      setLoading(false);
      console.log('🔄 Loading finished');
      console.log('=== EQUIPMENT CREATION ENDED ===');
    }
  };

  const handleBulkUpload = async () => {
    const file = bulkFileRef.current?.files[0];
    if (!file) {
      showNotification('Please select a file', 'error');
      return;
    }

    setLoading(true);

    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const wb = XLSX.read(e.target.result, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const parsedData = XLSX.utils.sheet_to_json(ws, { header: 1 });
          resolve(parsedData);
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
      });

      console.log('Parsed XLSX data:', data);

      const headers = data[0];
      const rows = data.slice(1);

      // Validate required headers
      const requiredHeaders = ['Equipment Name', 'Category', 'Model'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        showNotification(`Missing required columns: ${missingHeaders.join(', ')}`, 'error');
        return;
      }

      console.log('Excel headers found:', headers);

      const equipments = rows
        .filter(row => row.some(cell => cell)) // Skip empty rows
        .map(row => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = row[i];
          });

          console.log('Raw row object:', obj);

          const categoryName = obj['Category']?.toString().trim();
          const cat = categories.find(c => c.name.toLowerCase() === categoryName?.toLowerCase());

          if (!cat) {
            throw new Error(`Category not found for "${categoryName}" in row: ${JSON.stringify(obj)}`);
          }

          // Validate required fields
          const equipmentName = obj['Equipment Name']?.toString().trim();
          const model = obj['Model']?.toString().trim();

          if (!equipmentName) {
            throw new Error(`Equipment Name is required for row: ${JSON.stringify(obj)}`);
          }
          if (!model) {
            throw new Error(`Model is required for row: ${JSON.stringify(obj)}`);
          }

          // Parse key features from Description column
          let keyFeatures = [];
          if (obj['Description'] && typeof obj['Description'] === 'string') {
            keyFeatures = obj['Description']
              .split(',')
              .map(feature => feature.trim())
              .filter(feature => feature);
            console.log('Parsed key_features from Description column:', keyFeatures);
          }

          // Parse images (Image column)
          let images = [];
          if (obj['Image'] && typeof obj['Image'] === 'string') {
            images = obj['Image']
              .split(',')
              .map(link => link.trim())
              .filter(link => link);
          }

          // Get brand_name (optional)
          const brandName = obj['Brand Name']?.toString().trim() || '';

          // Build equipment object matching API schema
          const equipment = {
            category_id: cat.id,
            name: equipmentName,
            brand_name: brandName,
            model: model,
            description: `${equipmentName} - Professional grade equipment`,
            key_features: keyFeatures,
            weight: { 
              value: parseFloat(obj['Weight']) || '', 
              unit: obj['Weight Unit']?.toString().trim() || 'kg' 
            },
            height: { 
              value: parseFloat(obj['Height']) || '', 
              unit: obj['Height Unit']?.toString().trim() || 'cm' 
            },
            images: images,
            plans: [],
            availability_status: 'available',
            is_active: true
          };

          // Parse security charges if available
          const securityCharges = parseFloat(obj['Estimated Security Charges (₹)']) || 0;

          // Currency is INR for rupee prices
          const currency = 'INR';

          // Handle pricing plans with ₹ symbol columns
          if (obj['Daily Price (₹)']) {
            equipment.plans.push({
              name: 'Daily',
              duration: 1,
              price: parseFloat(obj['Daily Price (₹)']) || 0,
              currency,
              features: securityCharges > 0 ? [`Security Charges: ₹${securityCharges}`] : [],
              is_active: true
            });
          }

          if (obj['Weekly Price (₹)']) {
            equipment.plans.push({
              name: 'Weekly',
              duration: 7,
              price: parseFloat(obj['Weekly Price (₹)']) || 0,
              currency,
              features: securityCharges > 0 ? [`Security Charges: ₹${securityCharges}`] : [],
              is_active: true
            });
          }

          if (obj['Monthly Price (₹)']) {
            equipment.plans.push({
              name: 'Monthly',
              duration: 30,
              price: parseFloat(obj['Monthly Price (₹)']) || 0,
              currency,
              features: securityCharges > 0 ? [`Security Charges: ₹${securityCharges}`] : [],
              is_active: true
            });
          }

          return equipment;
        });

      console.log('=== TOTAL EQUIPMENTS TO PROCESS ===');
      console.log('Count:', equipments.length);
      equipments.forEach((eq, idx) => {
        console.log(`\nEquipment ${idx + 1}:`, {
          category_id: eq.category_id,
          name: eq.name,
          brand_name: eq.brand_name,
          model: eq.model,
          description: eq.description,
          description_length: eq.description?.length || 0,
          key_features: eq.key_features,
          plans: eq.plans,
          images: eq.images
        });
      });

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < equipments.length; i++) {
        const equipment = equipments[i];
        
        try {
          console.log(`\n📦 Processing equipment ${i + 1}/${equipments.length}:`, equipment.model);
          
          const payload = {
            category_id: equipment.category_id,
            name: equipment.name,
            model: equipment.model,
            description: equipment.description,
            key_features: equipment.key_features.length > 0 ? equipment.key_features : undefined,
            weight: equipment.weight.value ? equipment.weight : undefined,
            height: equipment.height.value ? equipment.height : undefined,
            links: equipment.images.length > 0 ? equipment.images : undefined,
            plans: equipment.plans.length > 0 ? equipment.plans : undefined,
            availability_status: equipment.availability_status,
            is_active: equipment.is_active
          };

          // Only add brand_name if it exists
          if (equipment.brand_name) {
            payload.brand_name = equipment.brand_name;
          }
          
          console.log('API payload:', JSON.stringify(payload, null, 2));
          await apiClient.post('/equipment', payload);
          successCount++;
          console.log(`✅ Success: ${equipment.model}`);
        } catch (error) {
          failCount++;
          console.error(`❌ Failed equipment ${i + 1}:`, equipment.model, error.message);
        }
      }

      console.log(`\n📊 Upload Complete: ${successCount} success, ${failCount} failed`);

      if (successCount > 0) {
        showNotification(`Upload complete: ${successCount} success, ${failCount} failed`, failCount > 0 ? 'error' : 'success');
        if (failCount === 0) {
          bulkFileRef.current.value = '';
        }
      } else {
        showNotification('Bulk upload failed - no equipment was uploaded', 'error');
      }
    } catch (error) {
      showNotification(error.message || 'Error processing bulk upload', 'error');
      console.error('Bulk upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFilter = () => {
    if (newFilter.trim() && !categoryForm.filters.includes(newFilter.trim())) {
      setCategoryForm(prev => ({
        ...prev,
        filters: [...prev.filters, newFilter.trim()]
      })) 
      setNewFilter('')
    }
  }

  const removeFilter = (filterToRemove) => {
    setCategoryForm(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter !== filterToRemove)
    }))
  }

  const addKeyFeature = () => {
    if (newKeyFeature.trim() && !equipmentForm.key_features.includes(newKeyFeature.trim()) && equipmentForm.key_features.length < 15) {
      setEquipmentForm(prev => ({
        ...prev,
        key_features: [...prev.key_features, newKeyFeature.trim()]
      }))
      setNewKeyFeature('')
    }
  }

  const removeKeyFeature = (featureToRemove) => {
    setEquipmentForm(prev => ({
      ...prev,
      key_features: prev.key_features.filter(feature => feature !== featureToRemove)
    }))
  }

  const addPlanFeature = () => {
    if (newPlanFeature.trim() && !newPlan.features.includes(newPlanFeature.trim()) && newPlan.features.length < 10) {
      setNewPlan(prev => ({
        ...prev,
        features: [...prev.features, newPlanFeature.trim()]
      }))
      setNewPlanFeature('')
    }
  }

  const removePlanFeature = (featureToRemove) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }))
  }

  const addPlan = () => {
    if (newPlan.name && newPlan.duration && newPlan.price && equipmentForm.plans.length < 5) {
      const plan = {
        name: newPlan.name,
        duration: parseInt(newPlan.duration),
        price: parseFloat(newPlan.price),
        currency: newPlan.currency,
        features: newPlan.features,
        is_active: true
      }
      setEquipmentForm(prev => ({
        ...prev,
        plans: [...prev.plans, plan]
      }))
      setNewPlan({
        name: '',
        duration: '',
        price: '',
        currency: 'INR',
        features: []
      })
    }
  }

  const removePlan = (planIndex) => {
    setEquipmentForm(prev => ({
      ...prev,
      plans: prev.plans.filter((_, index) => index !== planIndex)
    }))
  }

  const removeImageUrl = (imageToRemove) => {
    setEquipmentForm(prev => ({
      ...prev,
      images: prev.images.filter(image => image !== imageToRemove)
    }))
  }

  const addImageUrl = () => {
    const urlInput = document.getElementById('imageUrlInput');
    const url = urlInput?.value.trim();
    
    if (url && equipmentForm.images.length < 10) {
      if (!equipmentForm.images.includes(url)) {
        setEquipmentForm(prev => ({
          ...prev,
          images: [...prev.images, url]
        }))
        urlInput.value = '';
        showNotification('Image URL added successfully!');
      } else {
        showNotification('This URL is already added', 'error');
      }
    } else if (equipmentForm.images.length >= 10) {
      showNotification('Maximum 10 image URLs allowed', 'error');
    }
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
                notification.type === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{notification.message}</span>
                <X className="w-4 h-4 ml-2 cursor-pointer" />
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Equipment Admin Panel
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen">
            <div className="p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'equipment'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">Add Equipment</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('category')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'category'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Manage Categories</span>
                </button>

                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'bulk'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Bulk Upload</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {activeTab === 'equipment' && (
              <div className="max-w-4xl">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Add New Equipment
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Select a category and fill in the equipment details
                    </p>
                  </div>

                  <form onSubmit={createEquipment} className="p-6 space-y-6">
                    {/* Category Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className={selectedCategory ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                            {selectedCategory ? selectedCategory.name : 'Select a category'}
                          </span>
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </button>

                        {showCategoryDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                            {categories.length === 0 ? (
                              <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                                No categories available
                              </div>
                            ) : (
                              categories.map(category => (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(category)
                                    setShowCategoryDropdown(false)
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                                >
                                  <div>
                                    <div className="font-medium">{category.name}</div>
                                    {category.filters && category.filters.length > 0 && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Filters: {category.filters.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Brand Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Brand Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={equipmentForm.brand_name}
                          onChange={(e) => setEquipmentForm(prev => ({ ...prev, brand_name: e.target.value }))}
                          placeholder="Enter brand name"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Model */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Model *
                        </label>
                        <input
                          type="text"
                          required
                          value={equipmentForm.model}
                          onChange={(e) => setEquipmentForm(prev => ({ ...prev, model: e.target.value }))}
                          placeholder="Enter model"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description * (minimum 10 characters)
                      </label>
                      <textarea
                        required
                        rows={4}
                        minLength={10}
                        value={equipmentForm.description}
                        onChange={(e) => setEquipmentForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter equipment description (minimum 10 characters)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Key Features */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Key Features (Optional - Max 15)
                      </label>
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          value={newKeyFeature}
                          onChange={(e) => setNewKeyFeature(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyFeature())}
                          placeholder="Add a key feature"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={addKeyFeature}
                          disabled={equipmentForm.key_features.length >= 15}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {equipmentForm.key_features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {equipmentForm.key_features.map((feature, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            >
                              {feature}
                              <button
                                type="button"
                                onClick={() => removeKeyFeature(feature)}
                                className="ml-2 text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Weight and Height */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Weight (Optional)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            value={equipmentForm.weight.value}
                            onChange={(e) => setEquipmentForm(prev => ({ 
                              ...prev, 
                              weight: { ...prev.weight, value: e.target.value }
                            }))}
                            placeholder="Enter weight"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={equipmentForm.weight.unit}
                            onChange={(e) => setEquipmentForm(prev => ({ 
                              ...prev, 
                              weight: { ...prev.weight, unit: e.target.value }
                            }))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="lbs">lbs</option>
                          </select>
                        </div>
                      </div>

                      {/* Height */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Height (Optional)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            value={equipmentForm.height.value}
                            onChange={(e) => setEquipmentForm(prev => ({ 
                              ...prev, 
                              height: { ...prev.height, value: e.target.value }
                            }))}
                            placeholder="Enter height"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={equipmentForm.height.unit}
                            onChange={(e) => setEquipmentForm(prev => ({ 
                              ...prev, 
                              height: { ...prev.height, unit: e.target.value }
                            }))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="cm">cm</option>
                            <option value="inches">inches</option>
                            <option value="m">m</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Image Upload */}
                    {/* Links Input */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Image URLs (Optional - Max 10 URLs)
  </label>

  {/* Input field to add URLs */}
  <div className="flex space-x-2 mb-3">
    <input
      type="url"
      id="imageUrlInput"
      placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
    />
    <button
      type="button"
      onClick={addImageUrl}
      disabled={equipmentForm.images.length >= 10}
      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
    >
      Add URL
    </button>
  </div>
 
  {equipmentForm.images && equipmentForm.images.length > 0 && (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        {equipmentForm.images.map((image, index) => (
          <div
            key={index}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 max-w-xs"
          >
            <span className="truncate">{image}</span>
            <button
              type="button"
              onClick={() => removeImageUrl(image)}
              className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {equipmentForm.images.length} of 10 URLs added
      </div>
    </>
  )}
</div>


                    {/* Availability Status */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Availability Status
                        </label>
                        <select
                          value={equipmentForm.availability_status}
                          onChange={(e) => setEquipmentForm(prev => ({ ...prev, availability_status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="available">Available</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="discontinued">Discontinued</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          value={equipmentForm.is_active}
                          onChange={(e) => setEquipmentForm(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{loading ? 'Creating...' : 'Create Equipment'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'category' && (
              <div className="max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Create Category
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Add a new equipment category with optional filters
                    </p>
                  </div>

                  <form onSubmit={createCategory} className="p-6 space-y-6">
                    {/* Category Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Filters */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filters (Optional)
                      </label>
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          value={newFilter}
                          onChange={(e) => setNewFilter(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFilter())}
                          placeholder="Add a filter"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={addFilter}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {categoryForm.filters.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {categoryForm.filters.map(filter => (
                            <span
                              key={filter}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              {filter}
                              <button
                                type="button"
                                onClick={() => removeFilter(filter)}
                                className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{loading ? 'Creating...' : 'Create Category'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Categories List */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Existing Categories
                    </h3>
                  </div>
                  <div className="p-6">
                    {categories.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No categories found
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categories.map(category => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </h4>
                              {category.filters && category.filters.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {category.filters.map(filter => (
                                    <span
                                      key={filter}
                                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
                                    >
                                      {filter}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                              <Check className="w-4 h-4 text-green-500" />
                              <span>Active</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bulk' && (
              <div className="max-w-4xl">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Bulk Upload Equipment
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Upload an XLSX file with columns: Equipment Name, Quantity, Daily Price, Weekly Price, Monthly Price, Category, Image (URL)
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select XLSX File
                      </label>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        ref={bulkFileRef}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={handleBulkUpload}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{loading ? 'Uploading...' : 'Upload and Store'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}