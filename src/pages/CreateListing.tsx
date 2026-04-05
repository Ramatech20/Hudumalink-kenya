import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getCountFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { useAuth } from '../AuthContext';
import { KENYAN_COUNTIES, CATEGORIES, TOWNS } from '../constants';
import { toast } from 'sonner';
import { Camera, MapPin, Tag, Info, DollarSign, Phone, MessageCircle, X, Upload, Loader2, Shield, ShoppingBag, Briefcase } from 'lucide-react';
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
    type: 'product' as 'product' | 'service',
    category: '',
    county: '',
    town: '',
    phone: '',
    whatsapp: '',
    stock: '',
    sizes: [] as string[],
    specifications: [] as { key: string, value: string }[],
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

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
    user.kycStatus !== 'verified' && 
    listingCount !== null && 
    listingCount >= 2;

  if (needsKYC) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
          <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Identity Verification Required</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            You have reached the limit of 2 free listings. To maintain a safe marketplace, all service providers and sellers must verify their identity before posting more listings.
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

  const totalSteps = 4;

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const MAX_SIZE = 3 * 1024 * 1024; // 3MB
      
      const validFiles = files.filter(file => {
        if (file.size > MAX_SIZE) {
          toast.error(`Image "${file.name}" is too large. Max size is 3MB.`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setSelectedFiles(prev => [...prev, ...validFiles]);
      
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadPromises = selectedFiles.map(async (file) => {
      const storageRef = ref(storage, `listings/${user?.uid}/${Date.now()}-${file.name}`);
      const uploadPromise = uploadBytes(storageRef, file);
      
      // Add a timeout to each upload
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error(`Upload timed out for ${file.name}`)), 30000) // 30 second timeout per image
      );

      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      if (!snapshot) throw new Error(`Upload failed for ${file.name}`);
      
      return getDownloadURL(snapshot.ref);
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
        type: formData.type,
        category: formData.category,
        images: imageUrls,
        location: {
          county: formData.county,
          town: formData.town,
          lat: formData.lat,
          lng: formData.lng
        },
        contact: {
          phone: formData.phone,
          whatsapp: formData.whatsapp
        },
        stock: formData.type === 'product' ? (formData.stock ? parseInt(formData.stock) : undefined) : undefined,
        sizes: formData.type === 'product' && formData.sizes.length > 0 ? formData.sizes : undefined,
        specifications: formData.specifications.length > 0 
          ? Object.fromEntries(formData.specifications.map(s => [s.key, s.value]))
          : undefined,
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
            {user?.kycStatus !== 'verified' && listingCount !== null && listingCount < 2 && (
              <p className="text-xs font-bold text-primary mt-1 flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Trial Listing {listingCount + 1}/2. Verify to become a trusted provider!
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div 
                key={step} 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  currentStep === step ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : 
                  currentStep > step ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-neutral-800 text-gray-400"
                )}
              >
                {currentStep > step ? "✓" : step}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Basic Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Listing Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. iPhone 13 Pro Max or Professional Plumbing Services"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Use clear, descriptive titles to help buyers find your listing.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, type: 'product', category: ''})}
                        className={cn(
                          "py-4 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-2",
                          formData.type === 'product' ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 text-gray-500"
                        )}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Product
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, type: 'service', category: ''})}
                        className={cn(
                          "py-4 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-2",
                          formData.type === 'service' ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 text-gray-500"
                        )}
                      >
                        <Briefcase className="w-5 h-5" />
                        Service
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Category <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
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
              </div>

              <div className="pt-6">
                <button 
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.title || !formData.category}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Next: Pricing & Details
                </button>
              </div>
            </section>
          )}

          {/* Step 2: Pricing & Details */}
          {currentStep === 2 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Pricing & Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Price (KES) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">KES</span>
                    <input 
                      type="number" 
                      required
                      placeholder="0.00"
                      className="w-full pl-14 pr-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                </div>
                {formData.type === 'product' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Stock Level <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      placeholder="How many do you have?"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Description <span className="text-red-500">*</span></label>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-neutral-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-white/10">
                      <p className="font-bold mb-1 text-primary">Pro Tip for Sellers:</p>
                      <ul className="list-disc pl-3 space-y-1 text-gray-300">
                        <li>Mention key features first</li>
                        <li>Be honest about the condition</li>
                        <li>Explain why you're selling (optional)</li>
                        <li>Include dimensions/weight if relevant</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <textarea 
                  required 
                  rows={5}
                  placeholder="Describe what you are selling or the service you offer in detail..."
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
                >
                  Back
                </button>
                <button 
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.price || !formData.description}
                  className="flex-grow bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Next: Media & Location
                </button>
              </div>
            </section>
          )}

          {/* Step 3: Media & Location */}
          {currentStep === 3 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Camera className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Media & Location</h2>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Photos <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 shadow-sm group">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {previews.length < 8 && (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-800 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                <p className="text-[10px] text-gray-400 font-medium">Upload up to 8 high-quality photos. First photo will be your cover.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                <div className="col-span-full">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className={cn(
                      "w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all font-bold text-sm mb-4",
                      formData.lat ? "bg-green-50 dark:bg-green-900/10 border-green-500 text-green-600" : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                    )}
                  >
                    <MapPin className="w-5 h-5" />
                    {formData.lat ? 'Location Captured ✓' : 'Use My Current Location for Proximity Search'}
                  </button>
                  <p className="text-[10px] text-gray-400 font-medium mb-4">Capturing your precise location helps buyers find you when they search for sellers nearby.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">County <span className="text-red-500">*</span></label>
                  <select 
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    value={formData.county}
                    onChange={(e) => setFormData({...formData, county: e.target.value, town: ''})}
                  >
                    <option value="">Select County</option>
                    {KENYAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Town / Area <span className="text-red-500">*</span></label>
                  <select 
                    required
                    disabled={!formData.county}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all shadow-sm"
                    value={formData.town}
                    onChange={(e) => setFormData({...formData, town: e.target.value})}
                  >
                    <option value="">Select Town</option>
                    {formData.county && TOWNS[formData.county]?.map(t => <option key={t} value={t}>{t}</option>)}
                    {!TOWNS[formData.county] && <option value="Other">Other</option>}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
                >
                  Back
                </button>
                <button 
                  type="button"
                  onClick={nextStep}
                  disabled={selectedFiles.length === 0 || !formData.county || !formData.town}
                  className="flex-grow bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Next: Contact & Review
                </button>
              </div>
            </section>
          )}

          {/* Step 4: Contact & Review */}
          {currentStep === 4 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-primary mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Contact & Review</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">Phone Number <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="0712345678"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">WhatsApp (Optional)</label>
                  <input 
                    type="tel" 
                    placeholder="+254712345678"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Listing Summary</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200">
                    <img src={previews[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{formData.title}</p>
                    <p className="text-sm text-primary font-black">KES {formData.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{formData.town}, {formData.county}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
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
      </div>
    </div>
  );
};

export default CreateListing;
