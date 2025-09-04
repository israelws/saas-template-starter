#!/usr/bin/env node

/**
 * Script to reset the language preference to English
 * Run this in the browser console to reset the language
 */

// For browser console:
console.log(`
To reset the language to English, copy and paste this in your browser console while on the admin dashboard:

localStorage.setItem('i18nextLng', 'en');
location.reload();

Current language setting: ${localStorage.getItem('i18nextLng') || 'not set'}
`);

// Alternatively, you can clear it completely:
// localStorage.removeItem('i18nextLng');