"use client";
import * as React from 'react';

export function OrgSwitcher() {
  const [orgId, setOrgId] = React.useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('orgId') ?? '' : ''
  );

  function apply(id: string) {
    setOrgId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('orgId', id);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="rounded-md border px-2 py-1 text-sm w-[320px]"
        placeholder="Paste org UUID…"
        value={orgId}
        onChange={(e) => apply(e.target.value)}
      />
      <span className="text-xs text-gray-500">
        Sent as <code>x-org-id</code> header
      </span>
    </div>
  );
}
