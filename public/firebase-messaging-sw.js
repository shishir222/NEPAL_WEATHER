// Firebase Cloud Messaging Service Worker
// Handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: 'AIzaSyAuRO1l2Eo1OcTPLSv0IildQKm_9YyM15w',
  authDomain: 'nepal-weather-gis.firebaseapp.com',
  projectId: 'nepal-weather-gis',
  storageBucket: 'nepal-weather-gis.appspot.com',
  messagingSenderId: '1095377790685',
  appId: '1:1095377790685:web:80c9aa9ed452a352b91d34',
});

const messaging = firebase.messaging();

// Handle background messages when app is closed
messaging.onBackgroundMessage((payload) => {
  console.log('[Background Message]:', payload);

  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'fcm-notification',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
