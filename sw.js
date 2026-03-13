const CACHE_NAME = 'mdm-app-v5.9.1';

// ஆஃப்லைனில் வேலை செய்ய தேவையான ஃபைல்கள்
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn-icons-png.flaticon.com/512/3135/3135695.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700;800&display=swap',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'
];

// Install Event - ஃபைல்களை போன் மெமரியில் சேமித்தல்
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - பழைய வெர்ஷன் ஃபைல்களை அழித்தல்
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - இன்டர்நெட் இருந்தால் புதிதாக எடுக்கும், இல்லை என்றால் சேமித்ததைக் காட்டும்
self.addEventListener('fetch', (event) => {
  // Firebase டேட்டாபேஸ் இணைப்புகளை Service Worker-ல் இருந்து தவிர்க்க வேண்டும் (Firebase-க்கு தனி Offline வசதி உள்ளது)
  if (event.request.url.includes('firestore.googleapis.com')) {
     return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // புதிய அப்டேட் வந்தால் Cache-ஐ அப்டேட் செய்தல்
        if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // நெட் இல்லை என்றால் ஆஃப்லைனில் வேலை செய்ய Cache-ல் இருந்து எடுத்தல்
        return caches.match(event.request);
      })
  );
});
