// API Route: POST /api/auth/logout
// Logout utente

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Rimuovi cookie di sessione
  response.cookies.delete('auth-token');
  
  return response;
}
