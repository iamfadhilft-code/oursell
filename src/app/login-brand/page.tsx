'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginBrandRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080B0B] text-[#94A3B8] flex items-center justify-center font-mono text-xs">
      Redirecting to Oursell Store Login...
    </div>
  );
}
