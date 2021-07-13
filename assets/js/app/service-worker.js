// app service-worker.js code
if (typeof log === 'undefined') {
  var log = function() {};
}
log('app service-worker.js loaded: ', self.location.pathname);

// Note: any importScripts(); are relative to the master-service-worker.js location
// importScripts('../../app/service-worker.js');
