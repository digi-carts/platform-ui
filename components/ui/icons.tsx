// Custom SVG icons for the super-admin sidebar
export function IconDashboard({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

export function IconAdmins({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2 20c0-4 3.1-7 7-7" />
      <path d="M16 13l1.5 1.5L21 11" strokeWidth="2" />
      <circle cx="17" cy="17" r="4" />
    </svg>
  );
}

export function IconStores({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

export function IconCustomers({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="6" r="2.5" />
      <circle cx="16" cy="6" r="2.5" />
      <path d="M2 19c0-3.3 2.7-6 6-6h.5" />
      <path d="M13 13.5A6 6 0 0122 19" />
      <path d="M11 14a4 4 0 014 4v1H7v-1a4 4 0 014-4z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

export function IconTemplates({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M2 8h20" />
      <path d="M8 8v13" />
    </svg>
  );
}

export function IconSubscriptions({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 10h20" />
      <circle cx="7" cy="15" r="1.5" fill="currentColor" />
      <path d="M11 15h6" strokeWidth="2" />
    </svg>
  );
}

export function IconNotifications({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10a6 6 0 0112 0v4l2 2H4l2-2v-4z" />
      <path d="M10 20a2 2 0 004 0" />
      <circle cx="18" cy="5" r="3" fill="#f97316" stroke="none" />
    </svg>
  );
}

export function IconPayment({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="15" rx="2" />
      <path d="M2 9h20" strokeWidth="2.5" />
      <rect x="5" y="13" width="4" height="3" rx="0.5" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

export function IconFirebase({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9 7 7 9 8 13c-2-1-3-3-3-5C3 13 5 19 12 22c7-3 9-9 7-14-1 2-3 4-5 4 1-2 0-6-2-10z"
        fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 9c0 2-1 4-3 5 1 2 3 3 3 3s2-1 3-3c-2-1-3-3-3-5z"
        fill="currentColor" fillOpacity="0.5" stroke="none" />
    </svg>
  );
}

export function IconSettings({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export function IconServices({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="4" rx="1" />
      <rect x="2" y="10" width="20" height="4" rx="1" />
      <rect x="2" y="17" width="20" height="4" rx="1" />
      <circle cx="6" cy="5" r="0.8" fill="currentColor" />
      <circle cx="6" cy="12" r="0.8" fill="currentColor" />
      <circle cx="6" cy="19" r="0.8" fill="currentColor" />
    </svg>
  );
}
