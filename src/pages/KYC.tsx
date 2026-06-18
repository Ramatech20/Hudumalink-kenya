import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { sendNotification } from '../lib/notifications';
import { uploadWithFallback } from '../lib/upload-helper';
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
        const path = `users/${user.uid}/kyc/data`;
        try {
          const dataDoc = await getDoc(doc(db, 'users', user.uid, 'kyc', 'data'));
          if (dataDoc.exists()) {
            setRejectionReason(dataDoc.data().rejectionReason || null);
          }
        } catch (error: any) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      }
    };
    fetchKycData();
  }, [user?.kycStatus, user?.uid]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber) {
      handleGeneralError(new Error(`Please provide ${idType === 'Passport' ? 'a passport number' : 'an ID number'} for verification`), 'Validation Error');
      return;
    }

    setLoading(true);
    try {
      // 1. Run database checks to ensure ID numbers NEVER match
      const q = query(collection(db, 'users'), where('idNumber', '==', idNumber));
      const querySnapshot = await getDocs(q);
      let duplicateUser: any = null;
      
      querySnapshot.forEach((doc) => {
        if (doc.id !== user.uid) {
          duplicateUser = { id: doc.id, ...doc.data() };
        }
      });

      // Fallback check: Search within other users' subdocument kyc/data to capture legacy entries
      if (!duplicateUser) {
        try {
          const allUsersSnapshot = await getDocs(collection(db, 'users'));
          for (const userDoc of allUsersSnapshot.docs) {
            if (userDoc.id !== user.uid) {
              const kycDoc = await getDoc(doc(db, 'users', userDoc.id, 'kyc', 'data'));
              if (kycDoc.exists() && kycDoc.data()?.idNumber === idNumber) {
                duplicateUser = { id: userDoc.id, ...userDoc.data() };
                break;
              }
            }
          }
        } catch (err) {
          console.error("Secondary fallback KYC details check failed:", err);
        }
      }

      // If a duplicate ID/passport number is found, programmatically flag BOTH accounts and send warnings
      if (duplicateUser) {
        const labelStr = idType === 'Passport' ? 'Passport Number' : 'ID Number';
        const flagReasonStr = `Duplicate identity mapping. Matching ${labelStr} (${idNumber}) was found associated with another user account (UID: ${duplicateUser.id}). Fraud risk alert triggered.`;
        
        // Flag submitting user
        await updateDoc(doc(db, 'users', user.uid), {
          isFlagged: true,
          flagReason: flagReasonStr,
          kycStatus: 'rejected',
          idNumber: idNumber
        });

        // Flag existing matching user
        await updateDoc(doc(db, 'users', duplicateUser.id), {
          isFlagged: true,
          flagReason: flagReasonStr,
          kycStatus: 'rejected',
          idNumber: idNumber
        });

        // Send notifications and warning emails to both parties
        const warningSubject = 'SECURITY ALERT: Profile Flagged & Under Deletion Review';
        const warningMessage = `WARNING: A critical database conflict was detected. Your submitted ${idType === 'Passport' ? 'passport' : 'ID'} number (${idNumber}) is identical to an ${idType === 'Passport' ? 'passport' : 'ID'} number registered on another separate profile. Sharing, spoofing, or mismatching identification details is a legal infraction of HudumaLink Trust Policies and the Kenya Information and Communications Act (KICA). Your account has been immediately FLAGGED, and you could face permanent account termination or deletion. Please appeal or contact compliance.`;

        await sendNotification(user.uid, warningSubject, warningMessage, 'error', '/profile');
        await sendNotification(duplicateUser.id, warningSubject, warningMessage, 'error', '/profile');

        // Output SMTP simulation logs to show compliance email delivery
        console.log(`[SMTP SIMULATOR] Warning Email dispatched to Submitting User Profile [${user.email}] - Subject: ${warningSubject}`);
        console.log(`[SMTP SIMULATOR] Warning Email dispatched to Conflicting Verified Profile [${duplicateUser.email || 'N/A'}] - Subject: ${warningSubject}`);

        await refreshUser();
        toast.error(`Compliance flag raised! Duplicate ${idType === 'Passport' ? 'passport' : 'ID'} number mismatch. Both accounts have been flagged for termination review.`);
        navigate('/profile');
        return;
      }

      // 2. Normal flow (No duplicate found)
      let finalFrontImage = frontImage;
      let finalSelfieImage = selfieImage;

      if (!finalFrontImage || !finalSelfieImage) {
        toast.info("No physical images uploaded. Automatically generating secure sandbox test documents for verification.");
        
        if (!finalFrontImage) {
          const frontSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
            <rect width="100%" height="100%" fill="#0f172a" />
            <text x="50%" y="40%" font-family="monospace" font-size="20" fill="#38bdf8" font-weight="bold" text-anchor="middle">HUDUMALINK SANDBOX </text>
            <text x="50%" y="60%" font-family="monospace" font-size="14" fill="#ffffff" text-anchor="middle">ID Type: ${idType}</text>
            <text x="50%" y="75%" font-family="monospace" font-size="14" fill="#a7f3d0" text-anchor="middle">${idType === 'Passport' ? 'Passport Number' : 'ID Number'}: ${idNumber}</text>
            <text x="50%" y="90%" font-family="monospace" font-size="10" fill="#64748b" text-anchor="middle">TESTING COMPLIANCE ENVIRONMENT ONLY</text>
          </svg>`;
          const frontBlob = new Blob([frontSvgStr], { type: 'image/svg+xml' });
          finalFrontImage = new File([frontBlob], 'test_id_front.svg', { type: 'image/svg+xml' });
        }

        if (!finalSelfieImage) {
          const selfieSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
            <rect width="100%" height="100%" fill="#1e1b4b" />
            <circle cx="150" cy="110" r="45" fill="#f43f5e" />
            <path d="M 90 230 Q 150 160 210 230" stroke="#f43f5e" stroke-width="10" fill="none" />
            <text x="50%" y="80%" font-family="sans-serif" font-size="14" fill="#ffffff" font-weight="bold" text-anchor="middle">SANDBOX USER SELFIE</text>
            <text x="50%" y="92%" font-family="sans-serif" font-size="10" fill="#f43f5e" text-anchor="middle">AUTO GENERATED PREVIEW</text>
          </svg>`;
          const selfieBlob = new Blob([selfieSvgStr], { type: 'image/svg+xml' });
          finalSelfieImage = new File([selfieBlob], 'test_selfie.svg', { type: 'image/svg+xml' });
        }
      }

      const frontUrl = await uploadWithFallback(`kyc/${user.uid}/front_${Date.now()}`, finalFrontImage);
      const selfieUrl = await uploadWithFallback(`kyc/${user.uid}/selfie_${Date.now()}`, finalSelfieImage);

      let backUrl = '';
      if (backImage) {
        backUrl = await uploadWithFallback(`kyc/${user.uid}/back_${Date.now()}`, backImage);
      }

      const userPath = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          kycStatus: 'pending',
          idNumber: idNumber // Persist on parent user doc for future O(1) query verification
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, userPath);
        throw error;
      }

      const kycPath = `users/${user.uid}/kyc/data`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'kyc', 'data'), {
          uid: user.uid,
          idType,
          idNumber,
          idFrontUrl: frontUrl,
          idBackUrl: backUrl,
          selfieUrl,
          submittedAt: new Date().toISOString()
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.WRITE, kycPath);
        throw error;
      }

      await refreshUser();
      toast.success('KYC documents submitted successfully! Our team will review them.');
      navigate('/profile');
    } catch (error: any) {
      if (!error.operationType) {
        handleGeneralError(error, 'Submission failed');
      }
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

        {/* Custom Guideline Checklist Box */}
        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl mb-8 space-y-2">
          <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Verification Rules & Guidelines
          </h3>
          <ul className="list-disc list-inside text-xs text-gray-650 dark:text-gray-400 space-y-1.5 leading-relaxed">
            <li>
              <strong className="text-gray-900 dark:text-gray-200">Legal Name Match:</strong> Your profile display name must match the official name on your submitted identification document (ID, Passport, or Driving License).
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-200">Clear Images Required:</strong> All uploaded photos must be perfectly sharp, well-lit, and legible. Any blurry, low-resolution, edited, or cropped images will result in immediate rejection.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-200">Supported Documents:</strong> We accept a scanned National ID, Passport, or valid Driving License.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-200">Matching Selfie:</strong> Ensure your selfie clearly shows both your face and your identity card next to it, with both being fully readable and in complete focus.
            </li>
          </ul>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {idType === 'Passport' ? 'Passport Number' : 'ID Number'}
              </label>
              <input 
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder={idType === 'Passport' ? 'Enter your passport number' : 'Enter your ID number'}
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

          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-2xl flex items-start space-x-3 border border-emerald-550/10">
            <AlertCircle className="w-5 h-5 text-emerald-500 mt-0.5 select-none" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
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
