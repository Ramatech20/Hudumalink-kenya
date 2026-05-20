import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Compresses an image to a maximum dimension, stripping metadata and converting to lightweight JPEG.
 */
export const compressImage = (file: File, maxW = 1000, maxH = 1000, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string || '');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Attempts to upload file to Firebase Storage with an automated timeout (12s).
 * If the upload fails or times out, it seamlessly falls back to returning the highly compressed, 
 * lightweight Base64 data URL. This data URL is small enough to fit within Firestore's 1MB limit.
 */
export const uploadWithFallback = async (storagePath: string, file: File): Promise<string> => {
  // Get compressed base64 version immediately as fallback
  let base64Fallback = '';
  try {
    base64Fallback = await compressImage(file);
  } catch (err) {
    console.warn('Compression failed, using original file representation as fallback', err);
  }

  // Next, attempt storage upload but abort quickly on connection issues or blocks
  try {
    const storageRef = ref(storage, storagePath);
    const uploadPromise = uploadBytes(storageRef, file);
    
    // Quick timeout (12 seconds) so the user gets instant feedback instead of waiting 180s
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage connection timed out')), 12000)
    );

    const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
    if (!snapshot) throw new Error('No upload snapshot');

    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.warn('Firebase Storage upload failed or was blocked by sandbox network. Safely falling back to secure Base64 data.', error);
    if (base64Fallback) {
      return base64Fallback;
    }
    // Final fail-safe: read original file as standard data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed reading fallback image data'));
      reader.readAsDataURL(file);
    });
  }
};
