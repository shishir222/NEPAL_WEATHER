import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeFirebase, getFirebaseMessaging } from './firebase';

// VAPID Key for push notifications
const VAPID_KEY = 'BLjw12CQlqxdaF-nTnrKUFscuDUoz0KLmo4lyYCeDTnKkAPxdZvVUuJDfu7KYKScYrDCH8k4OqFdUOfaT4eDv8Y';

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null if permission denied
 */
export async function requestPermission() {
  try {
    // Check if the browser supports service workers
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this browser');
      return null;
    }

    // Check if FCM is supported
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register service worker if not already registered
    let serviceWorkerRegistration = null;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      serviceWorkerRegistration = registrations.find(reg => 
        reg.scope === window.location.origin + '/'
      );
      
      if (!serviceWorkerRegistration) {
        console.log('Registering Firebase Service Worker from: /firebase-messaging-sw.js');
        
        // Register from public directory
        serviceWorkerRegistration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        );
        
        console.log('✅ Service Worker registered successfully:', serviceWorkerRegistration);
      } else {
        console.log('✅ Service Worker already registered:', serviceWorkerRegistration);
      }
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      return null;
    }

    // Initialize Firebase and get messaging
    initializeFirebase();
    const messaging = getFirebaseMessaging();

    // Get FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    
    if (token) {
      console.log('FCM Token received:', token);
      // TODO: Send this token to your backend for storing in the database
      return token;
    } else {
      console.log('No FCM token received');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Listen for incoming messages when the app is in the foreground
 */
export function listenMessages() {
  try {
    // Initialize Firebase
    initializeFirebase();
    const messaging = getFirebaseMessaging();

    // Listen for messages when the app is in the foreground
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);

      // Customize notification appearance
      const notificationTitle = payload.notification?.title || 'Notification';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new message',
        icon: payload.notification?.icon || '/vite.svg',
        image: payload.notification?.image,
        badge: '/vite.svg',
        tag: 'fcm-notification',
        data: payload.data || {},
      };

      // Show notification
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(notificationTitle, notificationOptions);
        });
      }
    });

    console.log('Foreground message listener set up');
  } catch (error) {
    console.error('Error setting up message listener:', error);
  }
}

/**
 * Get the current FCM token
 * @returns {Promise<string|null>} Current FCM token or null
 */
export async function getFCMToken() {
  try {
    initializeFirebase();
    const messaging = getFirebaseMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token || null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}
