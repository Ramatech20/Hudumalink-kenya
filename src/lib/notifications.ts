import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Notification } from '../types';

export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  link?: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      read: false,
      link,
      createdAt: new Date().toISOString(),
    });

    // Mock Email sending
    console.log(`[EMAIL] To: ${userId}, Subject: ${title}, Body: ${message}`);
    
    // Mock SMS sending
    console.log(`[SMS] To: ${userId}, Message: ${title}: ${message}`);

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};
