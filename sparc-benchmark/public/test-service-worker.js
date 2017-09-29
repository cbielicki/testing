//service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/browser_modules/sparc-app.js', {scope: '/browser_modules/'})
  .then(function(reg) {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}