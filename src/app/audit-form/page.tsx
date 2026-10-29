'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuditFormClient from './AuditFormClient';

function AuditFormContainer() {
  const searchParams = useSearchParams();
  const cmsCode = searchParams.get('cmsCode') || '';
  const roName = searchParams.get('roName') || '';
  const brand = searchParams.get('brand') || '';
  const canopy = searchParams.get('canopy') || '';
  const tsm = searchParams.get('tsm') || '';
  const viewOnly = searchParams.get('viewOnly') === 'true' || searchParams.get('view') === 'readonly';
  const forceNew = searchParams.get('newAudit') === 'true' || searchParams.get('forceNew') === 'true';

  return (
    <AuditFormClient
      initialCmsCode={cmsCode}
      initialRoName={roName}
      initialBrand={brand}
      initialCanopy={canopy}
      initialTsm={tsm}
      viewOnly={viewOnly}
      forceNew={forceNew}
    />
  );
}

export default function AuditFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-700">Loading Assessment Module...</p>
        </div>
      }
    >
      <AuditFormContainer />
    </Suspense>
  );
}
