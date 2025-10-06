import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');

  // Se l'utente è loggato, redirect alla dashboard
  if (token) {
    redirect('/tracking');
  }

  // Altrimenti redirect al login
  redirect('/login');
}
