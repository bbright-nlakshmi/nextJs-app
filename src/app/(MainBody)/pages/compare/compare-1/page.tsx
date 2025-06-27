'use client';
import dynamic from 'next/dynamic';
import Layout1 from '@/views/layouts/layout1';

const ComparePage = dynamic(() => import('@/views/pages/compare/comparePage2'), {
  ssr: false,
  loading: () => (
    <div className="container p-4 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading comparison page...</span>
      </div>
      <p className="mt-2">Loading comparison page...</p>
    </div>
  ),
});

export default function ComparePageWrapper() {
  return (
    <Layout1>
      <ComparePage />
    </Layout1>
  );
}