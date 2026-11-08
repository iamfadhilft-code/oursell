'use client';
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import PosRegisterPage from '@/app/pos/register/page';

export default function StorePosPage() {
  const params = useParams();
  const storeSlug = (params?.storeSlug as string) || 'oursell';
  const { setActiveBrand } = usePosStore();

  useEffect(() => {
    setActiveBrand(storeSlug, storeSlug === 'oursell' ? 'Oursell Demo Store' : storeSlug);
  }, [storeSlug, setActiveBrand]);

  return <PosRegisterPage />;
}
