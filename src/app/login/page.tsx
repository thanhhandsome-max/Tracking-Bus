'use client';

import AuthForm from '@/components/AuthForm';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (userData: any) => {
    // Redirect based on user role
    setTimeout(() => {
      if (userData.role === 'driver') {
        router.push('/driver');
      } else if (userData.role === 'admin') {
        router.push('/admin'); // You can create admin dashboard later
      } else {
        router.push('/'); // Parent dashboard
      }
    }, 1500);
  };

  return <AuthForm onLoginSuccess={handleLoginSuccess} />;
}
