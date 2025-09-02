/**
 * Cookie utility functions for handling auth tokens
 */

export const setCookie = (name: string, value: string, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = date.toUTCString();

  // Build cookie string with proper format for CORS
  // Use SameSite=None for cross-origin requests (requires Secure)
  const isProduction = window.location.protocol === 'https:';
  const sameSite = isProduction ? 'None' : 'Lax';
  
  const cookieParts = [
    `${name}=${value}`,
    `expires=${expires}`,
    'path=/',
    `SameSite=${sameSite}`
  ];

  // Must use Secure with SameSite=None
  if (isProduction) {
    cookieParts.push('Secure');
  }

  document.cookie = cookieParts.join('; ');
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};
