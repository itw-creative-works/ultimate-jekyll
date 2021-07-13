; // This fixes the frontmatter formatting

// self.addEventListener('install', function(event) {
// });
var SWManager = {
  config: {},
  version: '1.0.0',
  brand: {
    name: 'default',
  },
  environment: 'production',
  libraries: {
    main: true,
    app: false,
    cachePolyfill: false,
  },
  cache: {
    breaker: '1626194253',
    name: ''
  }
};

// Setup
try {
  SWManager.config = JSON.parse(new URL(self.location).searchParams.get('config'));
  SWManager.version = SWManager.config.v;
  SWManager.environment = SWManager.config.env;
  SWManager.brand.name = SWManager.config.name;
  log('master-service-worker.js setup: ', self.location.pathname, SWManager)
} catch (e) {
  log('master-service-worker.js failed setup.')
}

// Load Firebase Messaging
try {
  importScripts('https://www.gstatic.com/firebasejs/8.7.1/firebase-app.js');
  importScripts('https://www.gstatic.com/firebasejs/8.7.1/firebase-messaging.js');

  // if (typeof firebase === 'undefined') {
  //   throw new Error('hosting/init-error: Firebase SDK not detected.');
  // }

  firebase.initializeApp(SWManager.config.firebase);
  var messaging = firebase.messaging();
  log('master-service-worker.js initialized Firebase.');
} catch (e) {
  log('master-service-worker.js failed to initialize Firebase.');
}

// Cache
try {
  // importScripts('libraries/serviceworker-cache-polyfill.js');
  SWManager.libraries.cachePolyfill = true;
  SWManager.cache.name = (SWManager.brand.name.toLowerCase().replace(' ', '') || 'default') + '-' + SWManager.cache.breaker;
  log('master-service-worker.js cache name = ' + SWManager.cache.name);
  // Refresh button breaks: https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68
  // - https://redfin.engineering/service-workers-break-the-browsers-refresh-button-by-default-here-s-why-56f9417694
  // example of apparently well-working service worker with OFFLINE shit: https://github.com/nolanlawson/serviceworker-update-demo/blob/master/sw.js

  // self.addEventListener('install', function (e){
  //   e.waitUntil(
  //     caches.open(SWManager.cache.name).then(function (cache){
  //       return cache.addAll([
  //         '/',
  //         '/index.html',
  //         /* '/?homescreen=1', */
  //         '/assets/css/main.css',
  //         '/assets/js/main.js',
  //       ])
  //       .then(function() {
  //         log('master-service-worker.js cached resources.');
  //         self.skipWaiting();
  //       })
  //       .catch(function() { log('master-service-worker.js failed to cache resources.') });
  //     })
  //   );
  // });
  //
  // self.addEventListener('activate', function(event) {
  //   event.waitUntil(self.clients.claim());
  // });

  // self.addEventListener('fetch', function(event) {
  //   event.respondWith(
  //     caches.open(SWManager.cache.name)
  //       .then(function(cache) { cache.match(event.request, {ignoreSearch: true}) })
  //       .then(function(response) {
  //       return response || fetch(event.request);
  //     })
  //   );
  // });

  // DAN'S CODE
  // self.addEventListener('message', messageEvent => {
  //   if (messageEvent.data === 'skipWaiting') return skipWaiting();
  // });

  // self.addEventListener('fetch', event => {
  //   event.respondWith((async () => {
  //     if (event.request.mode === "navigate" &&
  //       event.request.method === "GET" &&
  //       registration.waiting &&
  //       (await clients.matchAll()).length < 2
  //     ) {
  //       registration.waiting.postMessage({command: 'skipWaiting'});
  //       return new Response("", {headers: {"Refresh": "0"}});
  //     }
  //     return await caches.match(event.request) ||
  //       fetch(event.request);
  //   })());
  // });

} catch (e) {
  log('master-service-worker.js failed to cache resources.');
}

// Load other Service Worker
try {
  importScripts('assets/js/app/service-worker.js');
  SWManager.libraries.app = true;
  log('master-service-worker.js imported app service-worker.js');
} catch (e) {
  log('master-service-worker.js failed to import app service-worker.js');
}

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

    if (data.command == '') { return };

    log('master-service-worker.js postMessage ', data);

    if (data.command == 'function') {
      data.args.function = data.args.function || function() {};
      data.args.function();
    } else if (data.command == 'debug') {
      console.log('master-service-worker.js Debug data =', data);
      event.ports[0].postMessage(response);
    } else if (data.command == 'skipWaiting') {
      self.skipWaiting();
      event.ports[0].postMessage(response);
    } else if (data.command == 'unregister') {
      self.registration.unregister()
      .then(function() {
        event.ports[0].postMessage(response);
      })
      .catch(function() {
        response.status = 'fail';
        event.ports[0].postMessage(response);
      });
    } else if (data.command == 'cache') {
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
    if (SWManager.environment == 'development') {
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
