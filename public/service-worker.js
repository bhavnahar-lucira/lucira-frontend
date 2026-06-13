/* eslint-disable no-undef */

// Defensive listener to handle push data
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      
      // For testing on localhost: Show a direct notification so we can see it working
      const title = data.title || 'Lucira Jewelry';
      const options = {
        body: data.message || data.body || 'New notification received',
        icon: data.icon || '/Favicon.png',
        badge: '/Favicon.png',
        data: data
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.warn('[Service Worker] Received a non-JSON push payload. Skipping to prevent crash.', event.data.text());
      event.stopImmediatePropagation();
    }
  }
});

importScripts('https://ssl.widgets.webengage.com/js/service-worker.js');
