import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db, storage } from '../firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { Shield, Upload, Camera, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const KYC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [idType, setIdType] = useState('National ID');
  const [idNumber, setIdNumber] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchKycData = async () => {
      if (user?.kycStatus === 'rejected') {
        try {
          const dataDoc = await getDoc(doc(db, 'users', user.uid, 'kyc', 'data'));
          if (dataDoc.exists()) {
            setRejectionReason(dataDoc.data().rejectionReason || null);
          }
        } catch (error) {
          console.error('Error fetching KYC data:', error);
        }
      }
    };
    fetchKycData();
  }, [user?.kycStatus, user?.uid]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontImage || !selfieImage || !idNumber) {
      toast.error('Please provide all required documents and ID number');
      return;
    }

    setLoading(true);
    try {
      const frontRef = ref(storage, `kyc/${user.uid}/front_${Date.now()}`);
      const selfieRef = ref(storage, `kyc/${user.uid}/selfie_${Date.now()}`);
      
      const [frontSnap, selfieSnap] = await Promise.all([
        uploadBytes(frontRef, frontImage),
        uploadBytes(selfieRef, selfieImage)
      ]);

      const [frontUrl, selfieUrl] = await Promise.all([
        getDownloadURL(frontSnap.ref),
        getDownloadURL(selfieSnap.ref)
      ]);

      let backUrl = '';
      if (backImage) {
        const backRef = ref(storage, `kyc/${user.uid}/back_${Date.now()}`);
        const backSnap = await uploadBytes(backRef, backImage);
        backUrl = await getDownloadURL(backSnap.ref);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        kycStatus: 'pending'
      });

      await setDoc(doc(db, 'users', user.uid, 'kyc', 'data'), {
        uid: user.uid,
        idType,
        idNumber,
        idFrontUrl: frontUrl,
        idBackUrl: backUrl,
        selfieUrl,
        submittedAt: new Date().toISOString()
      });

      await refreshUser();
      toast.success('KYC documents submitted successfully! Our team will review them.');
      navigate('/profile');
    } catch (error: any) {
      toast.error('Submission failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (user.kycStatus === 'pending') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm"
        >
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verification in Progress</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            We are currently reviewing your documents. This usually takes 24-48 hours. 
            We'll notify you once the process is complete.
          </p>
          <button 
            onClick={() => navigate('/profile')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
          >
            Back to Profile
          </button>
        </motion.div>
      </div>
    );
  }

  if (user.kycStatus === 'verified') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Identity Verified</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Congratulations! Your identity has been verified. You now have full access to HudumaLink features.
          </p>
          <button 
            onClick={() => navigate('/profile')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
          >
            Back to Profile
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Your Identity</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Required for Service Providers and Sellers to build trust.</p>
          </div>
        </div>

        {user.kycStatus === 'rejected' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl mb-8 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Previous Submission Rejected</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">Reason: {rejectionReason || 'Documents were unclear or invalid.'}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Identification Type</label>
              <select 
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="National ID">National ID</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID Number</label>
              <input 
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter your ID number"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Documents</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Front */}
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFrontImage(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="id-front"
                />
                <label 
                  htmlFor="id-front"
                  className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-2xl cursor-pointer hover:border-primary transition-colors bg-gray-50 dark:bg-neutral-800/50 overflow-hidden"
                >
                  {frontImage ? (
                    <img src={URL.createObjectURL(frontImage)} alt="Front" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">ID Front Side</span>
                    </>
                  )}
                </label>
              </div>

              {/* ID Back (Optional for Passport) */}
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setBackImage(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="id-back"
                />
                <label 
                  htmlFor="id-back"
                  className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-2xl cursor-pointer hover:border-primary transition-colors bg-gray-50 dark:bg-neutral-800/50 overflow-hidden"
                >
                  {backImage ? (
                    <img src={URL.createObjectURL(backImage)} alt="Back" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">ID Back Side (Optional)</span>
                    </>
                  )}
                </label>
              </div>

              {/* Selfie */}
              <div className="relative group md:col-span-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSelfieImage(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="selfie"
                />
                <label 
                  htmlFor="selfie"
                  className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-2xl cursor-pointer hover:border-primary transition-colors bg-gray-50 dark:bg-neutral-800/50 overflow-hidden"
                >
                  {selfieImage ? (
                    <img src={URL.createObjectURL(selfieImage)} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Take a Selfie with your ID</span>
                      <span className="text-[10px] text-gray-400 mt-1">Ensure your face and ID details are clearly visible</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Your data is encrypted and stored securely. We only use this information to verify your identity and prevent fraud on HudumaLink.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit for Verification</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KYC;
