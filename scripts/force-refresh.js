// Force refresh with cache clear
// Run this in browser console

console.log('Clearing React cache and forcing refresh...');

// Clear any cached data
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('Clearing React DevTools cache...');
}

// Clear session storage
sessionStorage.clear();
console.log('✓ Cleared session storage');

// Force hard reload
console.log('Forcing hard reload in 2 seconds...');
setTimeout(() => {
  window.location.reload(true);
}, 2000);