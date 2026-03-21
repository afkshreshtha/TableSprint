import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only handle auth callback
  if (request.nextUrl.pathname === '/auth/callback') {
    console.log('🔥 MIDDLEWARE: Callback hit!');
    console.log('URL:', request.url);
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/callback'],
}