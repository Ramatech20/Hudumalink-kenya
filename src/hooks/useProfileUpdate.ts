import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { toast } from 'sonner';
import { handleAppError } from '../lib/error-handler';
import { ExtendedUser } from '../types';

export const useProfileUpdate = (user: ExtendedUser | undefined, onComplete?: () => void) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: '',
    phoneNumber: '',
    county: '',
    town: '',
    lat: null as number | null,
    lng: null as number | null,
    role: 'customer' as 'customer' | 'provider' | 'seller',
    photoURL: '',
    dob: '',
    countyOfBirth: '',
    residence: '',
    area: '',
    gender: 'male' as 'male' | 'female' | 'other' | '',
    occupation: ''
  });

  // Extended Settings States
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [twoFaMethod, setTwoFaMethod] = useState<'sms' | 'authenticator'>('sms');
  const [walletMpesaNumber, setWalletMpesaNumber] = useState('');
  const [walletBankName, setWalletBankName] = useState('');
  const [walletAccountName, setWalletAccountName] = useState('');
  const [walletAccountNumber, setWalletAccountNumber] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [agreeVatTurnover, setAgreeVatTurnover] = useState(false);
  const [alertsPush, setAlertsPush] = useState(false);
  const [alertsSms, setAlertsSms] = useState(false);
  const [alertsEmail, setAlertsEmail] = useState(false);
  const [disbursementMethod, setDisbursementMethod] = useState<'mpesa' | 'bank'>('mpesa');

  useEffect(() => {
    if (user) {
      setEditData({
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        county: user.location?.county || '',
        town: user.location?.town || '',
        lat: user.location?.lat ?? null,
        lng: user.location?.lng ?? null,
        role: (user.role || 'customer') as 'customer' | 'provider' | 'seller',
        photoURL: user.photoURL || '',
        dob: user.dob || '',
        countyOfBirth: user.countyOfBirth || '',
        residence: user.residence || '',
        area: user.area || '',
        gender: user.gender || '',
        occupation: user.occupation || ''
      });
      setIs2faEnabled(user.is2faEnabled || false);
      setTwoFaMethod(user.twoFaMethod || 'sms');
      setWalletMpesaNumber(user.walletMpesaNumber || '');
      setWalletBankName(user.walletBankName || '');
      setWalletAccountName(user.walletAccountName || '');
      setWalletAccountNumber(user.walletAccountNumber || '');
      setKraPin(user.kraPin || '');
      setAgreeVatTurnover(user.agreeVatTurnover || false);
      setAlertsPush(user.alertsPush || false);
      setAlertsSms(user.alertsSms || false);
      setAlertsEmail(user.alertsEmail || false);
      setDisbursementMethod(user.disbursementMethod || 'mpesa');
    }
  }, [user, isEditing]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to update your profile.');
      return;
    }

    let formattedPhone = (editData.phoneNumber || '').trim().replace(/\s+/g, '').replace(/\+/g, '');
    if (formattedPhone) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      }
      if (!/^254[17]\d{8}$/.test(formattedPhone)) {
        toast.error('Please enter a valid Kenyan M-Pesa phone number (e.g., 07XXXXXXXX, 01XXXXXXXX or 254XXXXXXXX).');
        return;
      }
      
      try {
        const phoneDoc = await getDoc(doc(db, 'phone_registry', formattedPhone));
        if (phoneDoc.exists() && phoneDoc.data()?.userId !== user.uid) {
          toast.error('This M-Pesa phone number is already registered to another account.');
          return;
        }
      } catch (error: any) {
        handleFirestoreError(error, OperationType.GET, `phone_registry/${formattedPhone}`);
        return;
      }
    }

    try {
      const updateData: any = {
        displayName: editData.displayName || '',
        phoneNumber: formattedPhone,
        location: {
          county: editData.county || '',
          town: editData.town || '',
          lat: editData.lat ?? null,
          lng: editData.lng ?? null
        },
        role: editData.role,
        photoURL: editData.photoURL || '',
        dob: editData.dob || '',
        countyOfBirth: editData.countyOfBirth || '',
        residence: editData.residence || '',
        area: editData.area || '',
        gender: editData.gender || '',
        occupation: editData.occupation || '',
        
        is2faEnabled,
        twoFaMethod,
        walletMpesaNumber,
        walletBankName,
        walletAccountName,
        walletAccountNumber,
        kraPin,
        agreeVatTurnover,
        alertsPush,
        alertsSms,
        alertsEmail,
        disbursementMethod,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      if (formattedPhone) {
        if (user.phoneNumber && user.phoneNumber !== formattedPhone) {
          await deleteDoc(doc(db, 'phone_registry', user.phoneNumber)).catch(e => console.warn("Failed deleting old phone doc:", e));
        }
        await setDoc(doc(db, 'phone_registry', formattedPhone), {
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      if (onComplete) onComplete();
    } catch (error: any) {
      handleAppError(error, `users/${user.uid}`, 'Failed to update profile');
    }
  };

  return {
    isEditing,
    setIsEditing,
    editData,
    setEditData,
    is2faEnabled,
    setIs2faEnabled,
    twoFaMethod,
    setTwoFaMethod,
    walletMpesaNumber,
    setWalletMpesaNumber,
    walletBankName,
    setWalletBankName,
    walletAccountName,
    setWalletAccountName,
    walletAccountNumber,
    setWalletAccountNumber,
    kraPin,
    setKraPin,
    agreeVatTurnover,
    setAgreeVatTurnover,
    alertsPush,
    setAlertsPush,
    alertsSms,
    setAlertsSms,
    alertsEmail,
    setAlertsEmail,
    disbursementMethod,
    setDisbursementMethod,
    handleUpdateProfile
  };
};
