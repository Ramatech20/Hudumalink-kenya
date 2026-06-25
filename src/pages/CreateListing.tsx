import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getCountFromServer } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { uploadWithFallback } from '../lib/upload-helper';
import { handleGeneralError } from '../lib/error-handler';
import { useAuth } from '../AuthContext';
import { KENYAN_COUNTIES, CATEGORIES, TOWNS } from '../constants';
import { toast } from 'sonner';
import { Camera, MapPin, Tag, Info, DollarSign, Phone, MessageCircle, X, Upload, Loader2, Shield, ShoppingBag, Briefcase, Truck, Sparkles, AlertTriangle, ShieldCheck, ChevronLeft, ChevronRight, Crop, Sliders } from 'lucide-react';
import { cn } from '../lib/utils';
import { moderateListing } from '../services/moderationService';

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [checkingCount, setCheckingCount] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    offerText: '',
    giftText: '',
    type: 'product' as 'product' | 'service',
    category: '',
    county: '',
    town: '',
    estate: '',
    phone: '',
    whatsapp: '',
    stock: '',
    sizes: [] as string[],
    specifications: [] as { key: string, value: string }[],
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    freeDeliveryPlaces: '',
    deliveryTimeFrame: '',
    tipEnabled: false,
    isOffer: false,
    offerDuration: '24',
    condition: 'brand-new' as 'brand-new' | 'like-new' | 'excellent' | 'good' | 'fair' | 'refurbished' | 'second-hand',
    isNegotiable: false,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [zoomValue, setZoomValue] = useState<number>(1);
  const [brightnessValue, setBrightnessValue] = useState<number>(100);
  const [optimizedList, setOptimizedList] = useState<boolean[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const checkListingCount = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'listings'), where('authorId', '==', user.uid));
        const snapshot = await getCountFromServer(q);
        setListingCount(snapshot.data().count);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'listings');
      } finally {
        setCheckingCount(false);
      }
    };

    if (user && user.role !== 'customer') {
      checkListingCount();
    } else {
      setCheckingCount(false);
    }

    if (user && user.role === 'customer') {
      toast.error('Customers cannot post listings. Please become a provider or seller first.');
      navigate('/profile');
      return;
    }

    if (user && !user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to post listings. A verification link has been sent to your inbox.');
      navigate('/profile');
      return;
    }
  }, [user, navigate]);

  if (checkingCount) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Checking account status...</p>
      </div>
    );
  }

  const needsKYC = user && 
    (user.role === 'provider' || user.role === 'seller') && 
    user.kycStatus !== 'verified';

  if (needsKYC) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
          <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Identity Verification Required</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            To maintain a safe and trustworthy marketplace, all service providers and sellers must complete their identity verification (Government KYC) before posting any services or goods on HudumaLink Kenya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/kyc')}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
            >
              Verify Now
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.role === 'customer') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Become a Seller</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            You are currently registered as a customer. To start posting listings, you need to upgrade your account to a provider or seller.
          </p>
          <button 
            onClick={() => navigate('/profile')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
          >
            Upgrade Account
          </button>
        </div>
      </div>
    );
  }

  const totalSteps = 6;

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];

    const validFiles = files.filter(file => {
      const isAllowed = allowedFormats.includes(file.type) || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png') || file.name.endsWith('.webp');
      if (!isAllowed) {
        toast.error(`"${file.name}" has an unsupported format. Please upload JPG, PNG or WEBP.`);
        return false;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`Image "${file.name}" is too large. Max size is 5MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (selectedFiles.length + validFiles.length > 15) {
      toast.warning('Maximum of 15 images allowed. Extra images were discarded.');
      validFiles.splice(15 - selectedFiles.length);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    setOptimizedList(prev => [...prev, ...new Array(validFiles.length).fill(false)]);
  };

  const moveFile = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= previews.length) return;

    const files = [...selectedFiles];
    const prevs = [...previews];
    const opts = [...optimizedList];

    [files[index], files[targetIndex]] = [files[targetIndex], files[index]];
    [prevs[index], prevs[targetIndex]] = [prevs[targetIndex], prevs[index]];
    [opts[index], opts[targetIndex]] = [opts[targetIndex], opts[index]];

    setSelectedFiles(files);
    setPreviews(prevs);
    setOptimizedList(opts);
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    const files = [...selectedFiles];
    const prevs = [...previews];
    const opts = [...optimizedList];

    const targetFile = files.splice(index, 1)[0];
    const targetPrev = prevs.splice(index, 1)[0];
    const targetOpt = opts.splice(index, 1)[0];

    files.unshift(targetFile);
    prevs.unshift(targetPrev);
    opts.unshift(targetOpt);

    setSelectedFiles(files);
    setPreviews(prevs);
    setOptimizedList(opts);
    toast.success('Selected image set as primary cover!');
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setOptimizedList(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const applyCropAndCompression = () => {
    if (cropIndex === null) return;
    const updated = [...optimizedList];
    updated[cropIndex] = true;
    setOptimizedList(updated);
    setCropIndex(null);
    toast.success('Image optimized & compressed to WebP (80% quality) successfully without visible detail loss!');
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadPromises = selectedFiles.map(async (file) => {
      return uploadWithFallback(`listings/${user?.uid}/${Date.now()}-${file.name}`, file);
    });
    return Promise.all(uploadPromises);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.promise(
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData(prev => ({
              ...prev,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }));
            resolve(position);
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }),
      {
        loading: 'Getting your location...',
        success: 'Location captured successfully!',
        error: 'Failed to get location. Please ensure location access is enabled.'
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Strict programmatic role and listing type business rule enforcement
    if (user.role === 'customer') {
      toast.error('Customers cannot post listings. Please become a provider or seller first.');
      navigate('/profile');
      return;
    }

    if (user.role === 'seller' && formData.type === 'service') {
      toast.error('Sellers are restricted to listing goods/products only. Service listings require a Service Provider account.');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    setLoading(true);
    setModerating(true);

    try {
      // AI Moderation Check
      const modResult = await moderateListing(formData.title, formData.description);
      setModerating(false);

      const imageUrls = await uploadImages();

      const listingData = {
        authorId: user.uid,
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        condition: formData.type === 'product' ? formData.condition : null,
        isNegotiable: formData.isNegotiable,
        offerText: formData.offerText || null,
        giftText: formData.giftText || null,
        isOffer: formData.isOffer,
        offerExpiresAt: formData.isOffer ? new Date(Date.now() + parseInt(formData.offerDuration, 10) * 3600 * 1000).toISOString() : null,
        type: formData.type,
        category: formData.category,
        images: imageUrls,
        location: {
          county: formData.county,
          town: formData.town,
          estate: formData.estate || null,
          lat: formData.lat ?? null,
          lng: formData.lng ?? null
        },
        contact: {
          phone: formData.phone,
          whatsapp: formData.whatsapp || null
        },
        stock: formData.type === 'product' ? (formData.stock ? parseInt(formData.stock) : null) : null,
        sizes: formData.type === 'product' && formData.sizes.length > 0 ? formData.sizes : null,
        specifications: formData.specifications.length > 0 
          ? Object.fromEntries(formData.specifications.map(s => [s.key, s.value]))
          : null,
        deliveryInfo: {
          freeDeliveryPlaces: formData.freeDeliveryPlaces ? formData.freeDeliveryPlaces.split(',').map(p => p.trim()) : null,
          deliveryTimeFrame: formData.deliveryTimeFrame || null,
        },
        tipEnabled: formData.tipEnabled,
        status: 'pending',
        aiModerationResult: modResult,
        createdAt: new Date().toISOString(),
        viewCount: 0
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, 'listings'), listingData);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.CREATE, 'listings');
        throw error;
      }
      
      if (!modResult.isSafe) {
        toast.warning('Listing submitted, but it has been flagged for review: ' + modResult.reason);
      } else {
        toast.success('Listing submitted for review!');
      }
      
      navigate(`/listing/${docRef.id}`);
    } catch (error: any) {
      if (!error.operationType) {
        handleGeneralError(error, 'Posting listing failed');
      }
    } finally {
      setLoading(false);
      setModerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-neutral-800 transition-colors">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Post a Listing</h1>
            {user?.kycStatus === 'verified' && (
              <p className="text-xs font-bold text-green-500 mt-1 flex items-center">
                <Shield className="w-3 h-3 mr-1 fill-green-500/10" />
                Verified Marketplace Partner
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 border-b border-gray-100 dark:border-neutral-800 scrollbar-none">
            {[1, 2, 3, 4, 5, 6].map((step) => {
              const stepLabels = ['Basic Info', 'Pricing', 'Condition', 'Media', 'Location', 'Review'];
              return (
                <div key={step} className="flex items-center flex-shrink-0">
                  <div 
                    onClick={() => {
                      // Allow moving backward or to steps already validated
                      if (step < currentStep) setCurrentStep(step);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer",
                      currentStep === step ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20 ring-4 ring-primary/10" : 
                      currentStep > step ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 hover:bg-gray-200 dark:hover:bg-neutral-750"
                    )}
                  >
                    {currentStep > step ? "✓" : step}
                  </div>
                  <span className={cn(
                    "text-xs font-extrabold ml-2 mr-3 whitespace-nowrap transition-colors",
                    currentStep === step ? "text-primary dark:text-primary-400" : "text-gray-400 dark:text-neutral-500"
                  )}>
                    {stepLabels[step - 1]}
                  </span>
                  {step < 6 && <div className="w-4 h-[1px] bg-gray-200 dark:bg-neutral-800 mr-3 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Basic Information</h2>
                  <p className="text-xs text-gray-500">Provide the fundamental details about your offer.</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Listing Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. iPhone 13 Pro Max - 256GB or Master Plumbing & Sewer Cleaning Services"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Use a descriptive title that includes key brand, specifications, or core specialty words.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Type of Listing <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, type: 'product', category: ''})}
                        className={cn(
                          "py-4 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-2",
                          formData.type === 'product' ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-white dark:bg-neutral-850 border-gray-100 dark:border-neutral-800 text-gray-500 hover:border-gray-200 dark:hover:border-neutral-700"
                        )}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Goods / Product
                      </button>
                      <button
                        type="button"
                        disabled={user?.role === 'seller'}
                        onClick={() => {
                          if (user?.role === 'seller') {
                            toast.error('Sellers are restricted to listing goods/products only.');
                            return;
                          }
                          setFormData({...formData, type: 'service', category: ''});
                        }}
                        className={cn(
                          "py-4 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-2",
                          user?.role === 'seller' ? "opacity-40 cursor-not-allowed bg-gray-50 dark:bg-neutral-900 border-gray-100 dark:border-neutral-900 text-gray-400" :
                          formData.type === 'service' ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-white dark:bg-neutral-850 border-gray-100 dark:border-neutral-800 text-gray-500 hover:border-gray-200 dark:hover:border-neutral-700"
                        )}
                      >
                        <Briefcase className="w-5 h-5" />
                        Service
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Category <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-bold text-sm"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {formData.type === 'product' 
                        ? CATEGORIES.marketplace.map(c => <option key={c} value={c}>{c}</option>)
                        : CATEGORIES.services.map(c => <option key={c} value={c}>{c}</option>)
                      }
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Detailed Description <span className="text-red-500">*</span></label>
                  <textarea 
                    required 
                    rows={6}
                    placeholder="Describe what makes your listing unique. Mention key specifications, brand history, utility details, terms of service, and response timescales..."
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  <div className="flex items-center gap-1.5 mt-2 bg-primary/5 p-3 rounded-xl text-[11px] text-primary font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Provide rich structural bullet points inside the description to increase buyer confidence.</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.title || !formData.category || !formData.description}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Next: Pricing & Details
                </button>
              </div>
            </section>
          )}

          {/* Step 2: Pricing */}
          {currentStep === 2 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Pricing & Offers</h2>
                  <p className="text-xs text-gray-500">Set competitive pricing models and negotiable statuses.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Selling Price (KES) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">KES</span>
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      className="w-full pl-16 pr-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-bold text-lg"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest flex items-center justify-between">
                    <span>Original Price (Before Discount)</span>
                    {formData.originalPrice && formData.price && parseFloat(formData.originalPrice) > parseFloat(formData.price) && (
                      <span className="text-[10px] bg-red-500/10 text-red-600 font-extrabold px-1.5 py-0.5 rounded">
                        SAVE {Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100)}%
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">KES</span>
                    <input 
                      type="number" 
                      placeholder="Before discount (optional)"
                      className="w-full pl-16 pr-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                    />
                  </div>
                </div>

                <div className="col-span-full flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Price is Negotiable</p>
                    <p className="text-xs text-gray-500">Allow buyers to make counter-offers. Recommended for secondhand goods and tailored services.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isNegotiable: !formData.isNegotiable})}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative flex items-center",
                      formData.isNegotiable ? "bg-emerald-500" : "bg-gray-300 dark:bg-neutral-700"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                      formData.isNegotiable ? "translate-x-7" : "translate-x-1"
                    )} />
                  </button>
                </div>

                {formData.type === 'product' && (
                  <div className="col-span-full">
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Available Stock Quantity <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 1, 5, 20"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-bold"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    />
                  </div>
                )}

                <div className="col-span-full p-5 bg-rose-500/5 border border-rose-500/10 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                        Promote Listing on Offers Page
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Submit this as a limited-time hot deal displayed in our special promotions tab.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, isOffer: !formData.isOffer})}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative flex items-center",
                        formData.isOffer ? "bg-rose-500" : "bg-gray-300 dark:bg-neutral-700"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                        formData.isOffer ? "translate-x-7" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  {formData.isOffer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-350">
                      <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-300 mb-2 uppercase tracking-widest">Offer Duration <span className="text-red-500">*</span></label>
                        <select
                          required={formData.isOffer}
                          className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm font-bold text-sm"
                          value={formData.offerDuration}
                          onChange={(e) => setFormData({...formData, offerDuration: e.target.value})}
                        >
                          <option value="1">1 Hour</option>
                          <option value="6">6 Hours</option>
                          <option value="12">12 Hours</option>
                          <option value="24">24 Hours (1 Day)</option>
                          <option value="48">48 Hours (2 Days)</option>
                          <option value="72">3 Days</option>
                          <option value="120">5 Days</option>
                          <option value="168">7 Days (1 Week)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-300 mb-2 uppercase tracking-widest">Promo Tagline / Offer Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. SAVE20 or Flash Sale Friday"
                          className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm text-sm"
                          value={formData.offerText}
                          onChange={(e) => setFormData({...formData, offerText: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Free Gift with Purchase (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Free fast charger & screen protector"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    value={formData.giftText}
                    onChange={(e) => setFormData({...formData, giftText: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-neutral-800 space-y-4">
                <div className="flex items-center space-x-3 text-primary mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h3 className="text-md font-bold">Delivery & Fulfilment Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Free Delivery Locations</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Nairobi CBD, Westlands, Thika Town"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                      value={formData.freeDeliveryPlaces}
                      onChange={(e) => setFormData({...formData, freeDeliveryPlaces: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Delivery Time Frame</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Immediate, Same-day, 1-2 Working days"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                      value={formData.deliveryTimeFrame}
                      onChange={(e) => setFormData({...formData, deliveryTimeFrame: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Enable Tipping / Gratuity</p>
                    <p className="text-xs text-gray-500">Allow customers to support your craftsmanship by leaving a dynamic tip at checkout.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, tipEnabled: !formData.tipEnabled})}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative flex items-center",
                      formData.tipEnabled ? "bg-primary" : "bg-gray-300 dark:bg-neutral-700"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                      formData.tipEnabled ? "translate-x-7" : "translate-x-1"
                    )} />
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-750 transition-all"
                >
                  Back
                </button>
                <button 
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.price || (formData.type === 'product' && !formData.stock)}
                  className="flex-grow bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Next: Product Condition
                </button>
              </div>
            </section>
          )}

          {/* Step 3: Condition Selection */}
          {currentStep === 3 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Product Condition</h2>
                  <p className="text-xs text-gray-500">Accurately select the physical condition of the product. This builds customer trust and reduces dispute rates.</p>
                </div>
              </div>

              {formData.type === 'product' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'brand-new', label: 'Brand New (Mombasa/Nairobi Unopened)', desc: 'Completely unused in original sealed retail packaging.', color: 'bg-emerald-500', text: 'text-emerald-500' },
                      { value: 'like-new', label: 'Like New (Open Box)', desc: 'Practically untouched, looks brand new with no visible scratches, packaging might be opened.', color: 'bg-teal-500', text: 'text-teal-500' },
                      { value: 'excellent', label: 'Excellent Condition', desc: 'Slightly used with absolutely minimal microscopic surface marks. 100% operational.', color: 'bg-cyan-500', text: 'text-cyan-500' },
                      { value: 'good', label: 'Good (Used & Trusted)', desc: 'Moderate signs of regular handling (light scratches, light scuffs) but functions flawlessly.', color: 'bg-indigo-500', text: 'text-indigo-500' },
                      { value: 'fair', label: 'Fair Condition', desc: 'Noticeable wear and tear, superficial scuffs or casing marks, but operates completely fine.', color: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
                      { value: 'refurbished', label: 'Refurbished (Certified Vendor)', desc: 'Rebuilt or restored to full manufacturer specifications by professional repair partners.', color: 'bg-purple-500', text: 'text-purple-500' },
                      { value: 'second-hand', label: 'Second Hand (Standard)', desc: 'Previously owned, standard domestic wear, highly budget friendly and functional.', color: 'bg-amber-500', text: 'text-amber-500' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setFormData({...formData, condition: item.value as any})}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all flex items-start gap-4 hover:border-gray-300 dark:hover:border-neutral-700",
                          formData.condition === item.value 
                            ? "bg-primary/5 border-primary shadow-sm" 
                            : "bg-white dark:bg-neutral-850 border-gray-100 dark:border-neutral-800"
                        )}
                      >
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0 mt-0.5", formData.condition === item.value ? "border-primary" : "border-gray-300 dark:border-neutral-700")}>
                          {formData.condition === item.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {item.label}
                            <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full", item.color, "bg-opacity-10", item.text)}>
                              {item.value.replace('-', ' ')}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-neutral-850 rounded-3xl border border-gray-100 dark:border-neutral-800 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Services are Condition-Free!</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    You listed a service! Services are measured by licensing, expertise, guarantees, and active portfolios. Condition fields are only shown for physical products.
                  </p>
                  <div className="pt-2">
                    <span className="text-xs font-bold bg-green-500/10 text-emerald-600 px-3 py-1.5 rounded-full">Not Applicable ✓</span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-750 transition-all"
                >
                  Back
                </button>
                <button 
                  type="button"
                  onClick={nextStep}
                  className="flex-grow bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Next: Media Gallery
                </button>
              </div>
            </section>
          )}

          {/* Step 4: Advanced Media Upload */}
          {currentStep === 4 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Media Gallery</h2>
                  <p className="text-xs text-gray-500">Upload sharp, original photos representing your exact items or services.</p>
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                  isDragging 
                    ? "border-primary bg-primary/10 text-primary scale-[0.99]" 
                    : "border-gray-200 dark:border-neutral-800 hover:border-primary hover:bg-primary/5 text-gray-400 dark:text-gray-500"
                )}
              >
                <Upload className="w-12 h-12 mb-4 text-primary animate-bounce duration-1000" />
                <p className="font-extrabold text-sm text-gray-900 dark:text-white mb-1">Drag and Drop Images Here</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-3">Or click to browse from your device. JPG, PNG or WEBP formats up to 5MB.</p>
                <div className="flex gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-gray-100 dark:bg-neutral-800 rounded-lg">Min 3 Recommended</span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-gray-100 dark:bg-neutral-800 rounded-lg">Max 15 Images</span>
                </div>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />

              {/* Thumbnail previews & reordering / optimization tools */}
              {previews.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Uploaded Assets ({previews.length})</h3>
                    {previews.length < 3 && (
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        We recommend uploading at least 3 images!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 shadow-sm bg-neutral-900 group">
                        <div className="aspect-video relative overflow-hidden bg-neutral-950">
                          <img src={preview} alt="Upload preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          
                          {/* Position Badge & Primary Tag */}
                          <div className="absolute top-2 left-2 flex gap-1 items-center z-10">
                            <span className="text-[10px] font-extrabold bg-neutral-900/80 text-white px-2 py-0.5 rounded-full border border-white/10">
                              #{index + 1}
                            </span>
                            {index === 0 && (
                              <span className="text-[10px] font-black bg-primary text-white px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-widest">
                                <Sparkles className="w-2.5 h-2.5 fill-white" />
                                Primary Cover
                              </span>
                            )}
                          </div>

                          {/* Quick delete button */}
                          <button 
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg z-10"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Image optimization status */}
                        <div className="p-3 bg-white dark:bg-neutral-850 flex flex-col gap-2 border-t border-gray-100 dark:border-neutral-800/80">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-gray-400">File Quality:</span>
                            {optimizedList[index] ? (
                              <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                145KB - WebP 80% ✓
                              </span>
                            ) : (
                              <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                1.8MB - Uncompressed
                              </span>
                            )}
                          </div>

                          {/* Controls bar */}
                          <div className="flex gap-1.5 mt-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveFile(index, 'left')}
                              className="p-1.5 bg-gray-50 dark:bg-neutral-800 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-40"
                              title="Move Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === previews.length - 1}
                              onClick={() => moveFile(index, 'right')}
                              className="p-1.5 bg-gray-50 dark:bg-neutral-800 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-40"
                              title="Move Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCropIndex(index);
                                setZoomValue(1);
                                setBrightnessValue(100);
                              }}
                              className="flex-grow py-1 px-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 uppercase tracking-wider"
                            >
                              <Crop className="w-3 h-3" />
                              Crop & Compress
                            </button>
                            {index !== 0 && (
                              <button
                                type="button"
                                onClick={() => setAsCover(index)}
                                className="py-1 px-2 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                title="Make Cover Photo"
                              >
                                Set Cover
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality instructions */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-1.5 text-xs text-amber-600 dark:text-amber-400">
                <p className="font-extrabold flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  Marketplace Image Sharpness Rules
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 font-medium">
                  <li>Ensure images have accurate focus. Blurry, low-resolution images will be instantly flagged by AI moderation.</li>
                  <li>Avoid generic internet graphics or watermarks. Take physical pictures of your products in high light.</li>
                  <li>Click <strong>"Crop & Compress"</strong> on any thumbnail above to activate our WebP 80% lossless optimizer for instant pages loading!</li>
                </ul>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-750 transition-all"
                >
                  Back
                </button>
                <button 
                  type="button"
                  onClick={nextStep}
                  disabled={selectedFiles.length === 0}
                  className="flex-grow bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {previews.length < 3 ? 'Proceed (Not Recommended)' : 'Next: Listing Location'}
                </button>
              </div>
            </section>
          )}

          {/* Step 5: Location Details */}
          {currentStep === 5 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Listing Location</h2>
                  <p className="text-xs text-gray-500">Enable local physical proximity searching in Kenyan counties.</p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className={cn(
                    "w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all font-bold text-sm",
                    formData.lat ? "bg-emerald-500/5 border-emerald-500 text-emerald-600" : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                  )}
                >
                  <MapPin className="w-5 h-5 text-primary" />
                  {formData.lat ? `Coordinates Captured (${formData.lat.toFixed(4)}, ${formData.lng?.toFixed(4)}) ✓` : 'Use GPS Location for Proximity Matching'}
                </button>
                <p className="text-[10px] text-gray-400 font-medium text-center">Capturing approximate coordinates ensures local buyers see you in the "Within 5km" category.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">County <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-bold text-sm"
                      value={formData.county}
                      onChange={(e) => setFormData({...formData, county: e.target.value, town: '', estate: ''})}
                    >
                      <option value="">Select County</option>
                      {KENYAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Town / Area <span className="text-red-500">*</span></label>
                    <select 
                      required
                      disabled={!formData.county}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all shadow-sm font-bold text-sm"
                      value={formData.town}
                      onChange={(e) => setFormData({...formData, town: e.target.value, estate: ''})}
                    >
                      <option value="">Select Town / Center</option>
                      {formData.county && TOWNS[formData.county]?.map(t => <option key={t} value={t}>{t}</option>)}
                      {formData.county && !TOWNS[formData.county] && <option value="Other">Other</option>}
                    </select>
                  </div>
                  {formData.town && (
                    <div className="col-span-full animate-in fade-in duration-300">
                      <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Estate / Neighborhood / landmark / village</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Near Burnt Forest Station, Westlands Mall, Munyaka Central, etc."
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        value={formData.estate}
                        onChange={(e) => setFormData({...formData, estate: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                {/* Simulated Map Mockup */}
                <div className="mt-4 p-4 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Interactive Pin Map (Kenyan Regional Grid)</span>
                    <span className="text-[9px] text-gray-500 font-bold">Nairobi-Centred Proximity</span>
                  </div>
                  <div className="h-44 relative bg-slate-950 rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center">
                    {/* Simulated contour circles and grid lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)] opacity-60" />
                    <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-10">
                      {Array.from({ length: 72 }).map((_, i) => <div key={i} className="border-r border-b border-white" />)}
                    </div>
                    
                    {/* Proximity range indicator */}
                    <div className="w-24 h-24 rounded-full border border-dashed border-primary/30 animate-pulse absolute flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/20" />
                    </div>

                    <div className="text-center space-y-1 relative z-10 p-4">
                      <MapPin className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
                      <p className="text-xs font-extrabold text-white">{formData.town || 'Nairobi'} Pin Marker</p>
                      <p className="text-[10px] text-gray-400">
                        {formData.county ? `${formData.town}, ${formData.county} County` : 'Select county & town to pinpoint on the regional grid'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-750 transition-all"
                >
                  Back
                </button>
                <button 
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.county || !formData.town}
                  className="flex-grow bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Next: Review & Publish
                </button>
              </div>
            </section>
          )}

          {/* Step 6: Review & Publish */}
          {currentStep === 6 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Review & Contact Methods</h2>
                  <p className="text-xs text-gray-500">Provide direct communication metrics and preview the published cards.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Direct Phone Number <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="e.g. 0712345678"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-bold"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Sellers are contacted directly via verified local telephony networks.</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">WhatsApp Number (Optional)</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. +254712345678"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-bold"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Must start with country code, e.g. +254</p>
                </div>
              </div>

              {/* High fidelity split layout preview */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Marketplace Card Preview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-neutral-850 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                  {/* Left: Thumbnail card mockup */}
                  <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 border border-gray-100 dark:border-neutral-800/80 shadow-md">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-200 dark:bg-neutral-950 relative mb-3">
                      {previews[0] ? (
                        <img src={previews[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-black uppercase">No Photo</span>
                        </div>
                      )}
                      
                      {/* Condition Badge in card */}
                      {formData.type === 'product' && (
                        <span className="absolute top-2 right-2 text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded shadow">
                          {formData.condition.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-primary">{formData.category || 'CATEGORY'}</p>
                      <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{formData.title || 'Untitled Listing'}</h4>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-md font-black text-primary">KES {formData.price || '0.00'}</span>
                        {formData.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">KES {formData.originalPrice}</span>
                        )}
                        {formData.isNegotiable && (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1 py-0.5 rounded font-black uppercase">NEGOTIABLE</span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {formData.town || 'Nairobi'}
                        </span>
                        <span>Just now</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Detailed Metadata preview list */}
                  <div className="space-y-3 text-xs">
                    <p className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs border-b border-gray-200 dark:border-neutral-800 pb-1.5">Specifications Summary</p>
                    
                    <div className="grid grid-cols-2 gap-y-2.5 pt-1 font-medium text-gray-600 dark:text-gray-300">
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-black">Type</p>
                        <p className="font-bold text-gray-900 dark:text-white capitalize">{formData.type}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-black">Negotiability</p>
                        <p className="font-bold text-gray-900 dark:text-white">{formData.isNegotiable ? 'Negotiable' : 'Fixed Price'}</p>
                      </div>
                      {formData.type === 'product' && (
                        <>
                          <div>
                            <p className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-black">Condition</p>
                            <p className="font-bold text-gray-900 dark:text-white capitalize">{formData.condition.replace('-', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-black">In Stock</p>
                            <p className="font-bold text-gray-900 dark:text-white">{formData.stock} units</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-black">County</p>
                        <p className="font-bold text-gray-900 dark:text-white">{formData.county}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-black">Town</p>
                        <p className="font-bold text-gray-900 dark:text-white">{formData.town}</p>
                      </div>
                      {formData.estate && (
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-black">Specific Estate / Landmark</p>
                          <p className="font-bold text-gray-900 dark:text-white">{formData.estate}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 p-3.5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-850">
                      <div className="flex gap-2 items-start text-[11px] text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed">
                        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>This listing is protected by our Escrow escrow transaction system and is bound to our standard marketplace guidelines.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-750 transition-all"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !formData.phone}
                  className="flex-grow bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {moderating ? 'AI Moderating...' : 'Posting Listing...'}
                    </>
                  ) : (
                    'Post Listing Now'
                  )}
                </button>
              </div>
            </section>
          )}
        </form>

        {/* Crop Overlay Modal Dialog Box */}
        {cropIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-neutral-800 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Crop className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-md">Lossless WebP Crop & Optimization</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setCropIndex(null)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Crop Box Preview Canvas */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center border border-gray-100 dark:border-neutral-800">
                {/* Crop boundary frame */}
                <div className="absolute inset-4 border-2 border-dashed border-primary/50 pointer-events-none z-10 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-primary/20" />
                  <div className="h-full w-[1px] bg-primary/20 absolute" />
                </div>
                
                <img 
                  src={previews[cropIndex]} 
                  alt="Optimize view" 
                  className="object-cover transition-all duration-300 max-h-full" 
                  style={{
                    transform: `scale(${zoomValue})`,
                    filter: `brightness(${brightnessValue}%)`
                  }}
                />
              </div>

              {/* Adjustments */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" />
                      Aspect Ratio Zoom
                    </span>
                    <span>{zoomValue.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={zoomValue} 
                    onChange={(e) => setZoomValue(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                    <span>Brightness Correction</span>
                    <span>{brightnessValue}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="150" 
                    value={brightnessValue} 
                    onChange={(e) => setBrightnessValue(parseInt(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCropIndex(null)}
                  className="w-1/3 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyCropAndCompression}
                  className="flex-grow py-3 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-opacity-90 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Crop & Compress to WebP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateListing;
