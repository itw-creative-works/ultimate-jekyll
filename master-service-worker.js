; // This fixes the frontmatter formatting

// self.addEventListener('install', function(event) {
// });
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
  SWManager.config = JSON.parse(new URL(self.location).searchParams.get('config'));
  SWManager.version = SWManager.config.v;
  SWManager.environment = SWManager.config.env;
  SWManager.brand.name = SWManager.config.name;
  SWManager.app = SWManager.config.id || (SWManager.brand.name.toLowerCase().replace(' ', '-') || 'default');
  SWManager.cache.breaker = SWManager.config.cb;
  SWManager.cache.name = SWManager.app + '-' + SWManager.cache.breaker;
  log('master-service-worker.js setup: ', self.location.pathname, SWManager.cache.name, SWManager)
} catch (e) {
  console.error('master-service-worker.js failed setup.', e)
}

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
  firebase.initializeApp(SWManager.config.firebase);
  firebase.messaging();
  SWManager.libraries.firebase = firebase;
  log('master-service-worker.js initialized Firebase.');
} catch (e) {
  console.error('master-service-worker.js failed to initialize Firebase.', e);
}

// Cache
try {
  // // importScripts('libraries/serviceworker-cache-polyfill.js');
  // SWManager.libraries.cachePolyfill = true;
  // log('master-service-worker.js cache name = ' + SWManager.cache.name);
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
  // //         log('master-service-worker.js cached resources.');
  // //         self.skipWaiting();
  // //       })
  // //       .catch(function() { log('master-service-worker.js failed to cache resources.') });
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
  console.error('master-service-worker.js failed to cache resources.', e);
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
//     log('master-service-worker.js handling PromoServer.');
//   }, SWManager.environment === 'development' ? 1 : 30000);
//   log('master-service-worker.js initialized PromoServer.');
// } catch (e) {
//   console.error('master-service-worker.js failed to import promo-server.js', e);
// }

// Send messages: https://stackoverflow.com/questions/35725594/how-do-i-pass-data-like-a-user-id-to-a-web-worker-for-fetching-additional-push
// more messaging: http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.XSKpRZNKiL8
self.addEventListener('message', function(event) {
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

    log('master-service-worker.js postMessage ', data);

    if (data.command === 'function') {
      data.args.function = data.args.function || function() {};
      data.args.function();
    } else if (data.command === 'debug') {
      console.log('master-service-worker.js Debug data =', data);
      event.ports[0].postMessage(response);
    } else if (data.command === 'skipWaiting') {
      self.skipWaiting();
      event.ports[0].postMessage(response);
    } else if (data.command === 'unregister') {
      self.registration.unregister()
      .then(function() {
        event.ports[0].postMessage(response);
      })
      .catch(function() {
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
      caches.open(SWManager.cache.name).then(function (cache){
        return cache.addAll(
          pagesToCache
        )
        .then(function() {
          log('master-service-worker.js cached resources.');
          event.ports[0].postMessage(response);
        })
        .catch(function() {
          response.status = 'fail';
          event.ports[0].postMessage(response);
          log('master-service-worker.js failed to cache resources.')
        });
      })
    }

    event.ports[0].postMessage(response);
  } catch (e) {
    response.success = 'fail';
    try { event.ports[0].postMessage(response) } catch (e) {}
    log('master-service-worker.js failed to receive message: ', data, e);
  }

});

function log() {
  try {
    if (SWManager.environment === 'development') {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[SW DEV LOG]');
      console.log.apply(console, args);
    } else if (false) {

    }
  } catch (e) {

  }
}

function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}


// Load other Service Worker
try {
  importScripts('assets/js/app/service-worker.js');
  SWManager.libraries.app = true;
  log('master-service-worker.js imported app/service-worker.js');
} catch (e) {
  console.error('master-service-worker.js failed to import app/service-worker.js', e);
}
