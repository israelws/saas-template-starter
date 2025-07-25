import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Get cookies from the request
  const cookieStore = cookies();
  const authToken = cookieStore.get('authToken');

  // Get authorization header
  const authHeader = request.headers.get('authorization');

  // Get all cookies for debugging
  const allCookies = cookieStore.getAll();

  return NextResponse.json({
    authToken: {
      exists: !!authToken,
      value: authToken?.value ? authToken.value.substring(0, 20) + '...' : null,
      httpOnly: authToken?.httpOnly,
      sameSite: authToken?.sameSite,
      secure: authToken?.secure,
      path: authToken?.path,
    },
    authHeader: authHeader ? authHeader.substring(0, 30) + '...' : null,
    allCookies: allCookies.map((cookie) => ({
      name: cookie.name,
      exists: true,
      valueLength: cookie.value.length,
    })),
    timestamp: new Date().toISOString(),
  });
}
