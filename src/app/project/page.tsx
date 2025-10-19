'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/project/technical');
  }, [router]);

  return null;
}
