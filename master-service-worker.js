; // This fixes the frontmatter formatting

// Service Worker Manager
var window = self;
var SWManager = {
  config: {},
  version: '',
  brand: {
    name: 'Default',
  },
  app: 'default',
  environment: 'production',
  libraries: {
    main: true,
    app: false,
    firebase: false,
    promoServer: false,
    cachePolyfill: false,
  },
  cache: {
    breaker: '',
    name: ''
  }
};

// Setup
try {
  // Parse config file
  SWManager.config = JSON.parse(new URL(self.location).searchParams.get('config'));

  // Set up SWManager
  SWManager.version = SWManager.config.v;
  SWManager.environment = SWManager.config.env;
  SWManager.brand.name = SWManager.config.name;
  SWManager.app = SWManager.config.id || (SWManager.brand.name.toLowerCase().replace(' ', '-') || 'default');
  SWManager.cache.breaker = SWManager.config.cb;
  SWManager.cache.name = SWManager.app + '-' + SWManager.cache.breaker;

  // Log
  log('Setup succeeded:', self.location.pathname, SWManager.version, SWManager.cache.name, SWManager)
} catch (e) {
  console.error('Setup failed:', e)
}

// Force service worker to use the latest version
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle clicks on notifications
// Open the URL of the notification
// ⚠️⚠️⚠️ THIS MUST BE PLACED BEFORE THE FIREBASE IMPORTS HANDLER ⚠️⚠️⚠️
// https://stackoverflow.com/questions/78270541/cant-catch-fcm-notificationclick-event-in-service-worker-using-firebase-messa
self.addEventListener('notificationclick', (event) => {
  // Get the properties of the notification
  const notification = event.notification;
  const data = (notification.data && notification.data.FCM_MSG ? notification.data.FCM_MSG.data : null) || {};
  const payload = (notification.data && notification.data.FCM_MSG ? notification.data.FCM_MSG.notification : null) || {};

  // Get the click action
  const clickAction = payload.click_action || data.click_action || '/';

  // Log
  log('Event: notificationclick event', event);
  log('Event: notificationclick data', data);
  log('Event: notificationclick payload', payload);
  log('Event: notificationclick clickAction', clickAction);

  // Handle the click
  event.waitUntil(
    clients.openWindow(clickAction)
  );

  // Close the notification
  notification.close();
});

// Messaging/Notifications resoruces
// https://firebase.google.com/docs/cloud-messaging/js/receive
// https://github.com/firebase/quickstart-js/tree/master/messaging

// Load Firebase
try {
  // Import Firebase libraries
  importScripts(
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-database-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
  );

  // Initialize app
  const app = firebase.initializeApp(SWManager.config.firebase);

  // Initialize messaging
  const messaging = firebase.messaging();

  // Attach firebase to SWManager
  SWManager.libraries.firebase = firebase;

  // Handle messages
  // messaging.onBackgroundMessage((payload) => {
  //   log('[firebase-messaging-sw.js] Received background message ', payload);

  //   // Customize notification here
  //   const title = 'Background Message Title';
  //   const options = {
  //     body: 'Background Message body.',
  //     icon: '/firebase-logo.png'
  //   };

  //   // Show notification
  //   self.registration.showNotification(title, options);
  // });

  // Log
  log('Firebase initialized successfully');
} catch (e) {
  console.error('Firebase failed to initialize', e);
}

// Cache
try {
  // // importScripts('libraries/serviceworker-cache-polyfill.js');
  // SWManager.libraries.cachePolyfill = true;
  // log('cache name = ' + SWManager.cache.name);
  //
  // // Refresh button breaks: https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68
  // // - https://redfin.engineering/service-workers-break-the-browsers-refresh-button-by-default-here-s-why-56f9417694
  // // example of apparently well-working service worker with OFFLINE shit: https://github.com/nolanlawson/serviceworker-update-demo/blob/master/sw.js
  //
  // // self.addEventListener('install', function (e){
  // //   e.waitUntil(
  // //     caches.open(SWManager.cache.name).then(function (cache){
  // //       return cache.addAll([
  // //         '/',
  // //         '/index.html',
  // //         /* '/?homescreen=1', */
  // //         '/assets/css/main.css',
  // //         '/assets/js/main.js',
  // //       ])
  // //       .then(function() {
  // //         log('cached resources.');
  // //         self.skipWaiting();
  // //       })
  // //       .catch(function() { log('failed to cache resources.') });
  // //     })
  // //   );
  // // });
  // //
  // // self.addEventListener('activate', function(event) {
  // //   event.waitUntil(self.clients.claim());
  // // });
  //
  // // self.addEventListener('fetch', function(event) {
  // //   event.respondWith(
  // //     caches.open(SWManager.cache.name)
  // //       .then(function(cache) { cache.match(event.request, {ignoreSearch: true}) })
  // //       .then(function(response) {
  // //       return response || fetch(event.request);
  // //     })
  // //   );
  // // });
  //
  // // DAN'S CODE
  // // self.addEventListener('message', messageEvent => {
  // //   if (messageEvent.data === 'skipWaiting') return skipWaiting();
  // // });
  //
  // // self.addEventListener('fetch', event => {
  // //   event.respondWith((async () => {
  // //     if (event.request.mode === "navigate" &&
  // //       event.request.method === "GET" &&
  // //       registration.waiting &&
  // //       (await clients.matchAll()).length < 2
  // //     ) {
  // //       registration.waiting.postMessage({command: 'skipWaiting'});
  // //       return new Response("", {headers: {"Refresh": "0"}});
  // //     }
  // //     return await caches.match(event.request) ||
  // //       fetch(event.request);
  // //   })());
  // // });

} catch (e) {
  console.error('Cache failed to initialize', e);
}

// Load PromoServer
// try {
//   // Import libraries
//   importScripts('https://cdn.jsdelivr.net/npm/promo-server@latest/dist/index.min.js');

//   // Register and handle
//   setTimeout(function () {
//     SWManager.libraries.promoServer = new PromoServer({
//       app: SWManager.app, // <any string>
//       platform: 'web', // web | electron | extension
//       log: true, // true | false
//       alwaysRun: SWManager.environment === 'development',
//       libraries: {
//         firebase: firebase, // reference to firebase (one will be implied if not provided)
//       },
//     });

//     SWManager.libraries.promoServer.handle();
//     log('handling PromoServer.');
//   }, SWManager.environment === 'development' ? 1 : 30000);
//   log('initialized PromoServer.');
// } catch (e) {
//   console.error('PromoServer failed to initialize', e);
// }

// Send messages: https://stackoverflow.com/questions/35725594/how-do-i-pass-data-like-a-user-id-to-a-web-worker-for-fetching-additional-push
// more messaging: http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.XSKpRZNKiL8
self.addEventListener('message', (event) => {
  var data;
  var response = {status: 'success', command: '', data: {}};
  try {
    // var data = JSON.parse(event.data) || {};
    // console.log('RAW DATA event:', event);
    // console.log('RAW DATA event.data:', event.data);
    data = event.data || {};

    data.command = data.command || '';
    data.args = data.args || {};
    response.command = data.command;

    if (data.command === '') { return };

    log('Event: postMessage ', data);

    if (data.command === 'function') {
      data.args.function = data.args.function || function() {};
      data.args.function();
    } else if (data.command === 'debug') {
      console.log('Debug data =', data);
      event.ports[0].postMessage(response);
    } else if (data.command === 'skipWaiting') {
      self.skipWaiting();
      event.ports[0].postMessage(response);
    } else if (data.command === 'unregister') {
      self.registration.unregister()
      .then(() => {
        event.ports[0].postMessage(response);
      })
      .catch(() => {
        response.status = 'fail';
        event.ports[0].postMessage(response);
      });
    } else if (data.command === 'cache') {
      data.args.pages = data.args.pages || [];
      var defaultPages =
      [
        '/',
        '/index.html',
        /* '/?homescreen=1', */
        '/assets/css/main.css',
        '/assets/js/main.js',
      ];
      var pagesToCache = arrayUnique(data.args.pages.concat(defaultPages));
      caches.open(SWManager.cache.name).then(cache => {
        return cache.addAll(
          pagesToCache
        )
        .then(() => {
          log('Cached resources.');
          event.ports[0].postMessage(response);
        })
        .catch(() => {
          response.status = 'fail';
          event.ports[0].postMessage(response);
          log('Failed to cache resources.')
        });
      })
    }

    event.ports[0].postMessage(response);
  } catch (e) {
    response.success = 'fail';
    try { event.ports[0].postMessage(response) } catch (e) {}
    log('Failed to receive message: ', data, e);
  }

});

function log() {
  // Get arguments
  var args = Array.prototype.slice.call(arguments);

  // Add prefix
  args.unshift(`[${new Date().toISOString()}] service-worker:`);

  // Log
  console.log.apply(console, args);
}

function arrayUnique(array) {
  var a = array.concat();

  // Loop through array
  for(var i=0; i<a.length; ++i) {
    for(var j=i+1; j<a.length; ++j) {
      if(a[i] === a[j]) {
        a.splice(j--, 1);
      }
    }
  }

  // Return
  return a;
}

// Load other Service Worker
try {
  // Import other service worker
  importScripts('assets/js/app/service-worker.js');

  // Set flag
  SWManager.libraries.app = true;

  // Log
  log('Import of app/service-worker.js succeeded');
} catch (e) {
  console.error('Import of app/service-worker.js failed', e);
}
