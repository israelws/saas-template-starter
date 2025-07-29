export const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  return Date.now() >= payload.exp * 1000;
};

export const getTokenExpiryTime = (token: string) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
};

export const logTokenStatus = () => {
  const accessToken = localStorage.getItem('authToken');
  const refreshToken = localStorage.getItem('refreshToken');

  console.log('=== Token Status ===');
  console.log('Access token exists:', !!accessToken);
  console.log('Refresh token exists:', !!refreshToken);

  if (accessToken) {
    const payload = decodeJWT(accessToken);
    if (payload) {
      console.log('Access token expires at:', new Date(payload.exp * 1000));
      console.log('Access token is expired:', isTokenExpired(accessToken));
      console.log('Access token subject:', payload.sub);
    }
  }

  if (refreshToken) {
    console.log('Refresh token (first 50 chars):', refreshToken.substring(0, 50));
  }

  console.log('==================');
};
