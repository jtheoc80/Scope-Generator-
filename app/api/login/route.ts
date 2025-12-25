import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  
  // Set a dev cookie
  cookieStore.set('dev_token', 'dev-access', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get('redirect_url') || '/dashboard';
  
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
