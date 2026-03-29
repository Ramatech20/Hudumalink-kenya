import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../AuthContext';
import { KENYAN_COUNTIES, CATEGORIES, TOWNS } from '../constants';
import { toast } from 'sonner';
import { Camera, MapPin, Tag, Info, DollarSign, Phone, MessageCircle, X, Upload, Loader2, Shield } from 'lucide-react';
import { moderateListing } from '../services/moderationService';

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user && (user.role === 'provider' || user.role === 'seller') && user.kycStatus !== 'verified') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
          <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Identity Verification Required</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            To maintain a safe marketplace, all service providers and sellers must verify their identity before posting listings.
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
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

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
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    });
    return Promise.all(uploadPromises);
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
            town: formData.town
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

      const docRef = await addDoc(collection(db, 'listings'), listingData);
      
      if (!modResult.isSafe) {
        toast.warning('Listing submitted, but it has been flagged for review: ' + modResult.reason);
      } else {
        toast.success('Listing submitted for review!');
      }
      
      navigate(`/listing/${docRef.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setModerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-neutral-800 transition-colors">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Post a New Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center text-primary">
              <Info className="w-5 h-5 mr-2" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Listing Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. iPhone 13 Pro Max or Professional Plumbing Services"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any, category: ''})}
                >
                  <option value="product">Product for Sale</option>
                  <option value="service">Service Offered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
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
          </section>

          {/* Pricing & Description */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center text-primary">
              <DollarSign className="w-5 h-5 mr-2" /> Pricing & Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (KES)</label>
                <input 
                  type="number" 
                  placeholder="Leave empty for 'Contact for Price'"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              {formData.type === 'product' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Units Left (Stock)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
              )}
              
              {formData.type === 'product' && (
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Sizes (Optional)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.sizes.map((size, idx) => (
                      <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center">
                        {size}
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, sizes: formData.sizes.filter((_, i) => i !== idx)})}
                          className="ml-2 hover:text-secondary"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="size-input"
                      placeholder="e.g. XL, 42, 10-inch"
                      className="flex-grow px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !formData.sizes.includes(val)) {
                            setFormData({...formData, sizes: [...formData.sizes, val]});
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('size-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !formData.sizes.includes(val)) {
                          setFormData({...formData, sizes: [...formData.sizes, val]});
                          input.value = '';
                        }
                      }}
                      className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specifications / Features (Optional)</label>
                <div className="space-y-2 mb-2">
                  {formData.specifications.map((spec, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-neutral-800 p-3 rounded-xl border border-gray-100 dark:border-neutral-700">
                      <div className="flex space-x-4">
                        <span className="font-bold text-sm">{spec.key}:</span>
                        <span className="text-sm">{spec.value}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, specifications: formData.specifications.filter((_, i) => i !== idx)})}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    id="spec-key"
                    placeholder="e.g. Color, Material, RAM"
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="spec-val"
                      placeholder="e.g. Space Gray, Leather, 8GB"
                      className="flex-grow px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const kInput = document.getElementById('spec-key') as HTMLInputElement;
                        const vInput = document.getElementById('spec-val') as HTMLInputElement;
                        const k = kInput.value.trim();
                        const v = vInput.value.trim();
                        if (k && v) {
                          setFormData({...formData, specifications: [...formData.specifications, { key: k, value: v }]});
                          kInput.value = '';
                          vInput.value = '';
                        }
                      }}
                      className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea 
                  required 
                  rows={5}
                  placeholder="Describe what you are selling or the service you offer..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center text-primary">
              <Camera className="w-5 h-5 mr-2" /> Images
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary transition-all"
                >
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium">Upload Photo</span>
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Upload high-quality images to attract more buyers. Max size: 3MB per image.</p>
            </div>
          </section>

          {/* Location */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center text-primary">
              <MapPin className="w-5 h-5 mr-2" /> Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">County</label>
                <select 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                  value={formData.county}
                  onChange={(e) => setFormData({...formData, county: e.target.value, town: ''})}
                >
                  <option value="">Select County</option>
                  {KENYAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Town / Area</label>
                <select 
                  required
                  disabled={!formData.county}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 dark:disabled:bg-neutral-900 transition-colors"
                  value={formData.town}
                  onChange={(e) => setFormData({...formData, town: e.target.value})}
                >
                  <option value="">Select Town</option>
                  {formData.county && TOWNS[formData.county]?.map(t => <option key={t} value={t}>{t}</option>)}
                  {!TOWNS[formData.county] && <option value="Other">Other</option>}
                </select>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center text-primary">
              <Phone className="w-5 h-5 mr-2" /> Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="0712345678"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp (Optional)</label>
                <input 
                  type="tel" 
                  placeholder="+254712345678"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                />
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
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
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
