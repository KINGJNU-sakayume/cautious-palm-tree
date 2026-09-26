import React from 'react'

// Stroke icons drawn on a 24×24 grid, coloured with currentColor.
// Usage: <HomeIcon size={20} className="text-ink-2" />

function Icon({ size = 18, className = '', strokeWidth = 1.8, children }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

const make = (paths) => function IconComponent(props) {
  return <Icon {...props}>{paths}</Icon>
}

export const HomeIcon = make(<>
  <path d="M3 10.5 12 3l9 7.5" />
  <path d="M5.5 9v11a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9" />
</>)

export const NotebookIcon = make(<>
  <rect x="4.5" y="3" width="15" height="18" rx="2" />
  <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
</>)

export const MedalIcon = make(<>
  <path d="M7 3h10l-3.4 7.2" />
  <path d="M7 3l3.4 7.2" />
  <circle cx="12" cy="15.5" r="5.5" />
  <path d="m12 13 .9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3z" strokeWidth="1.2" />
</>)

export const TrophyIcon = make(<>
  <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
  <path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.5M17 6h2.5a2.5 2.5 0 0 1-2.6 3.5" />
  <path d="M12 14v4M8.5 21h7M9.5 18h5v3h-5z" />
</>)

export const SettingsIcon = make(<>
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
</>)

export const PlusIcon = make(<path d="M12 5v14M5 12h14" />)
export const XIcon = make(<path d="M18 6 6 18M6 6l12 12" />)
export const CheckIcon = make(<path d="m5 12.5 4.5 4.5L19 7.5" />)
export const ChevronDownIcon = make(<path d="m6 9 6 6 6-6" />)
export const ChevronRightIcon = make(<path d="m9 6 6 6-6 6" />)
export const ChevronLeftIcon = make(<path d="m15 6-6 6 6 6" />)
export const ArrowLeftIcon = make(<path d="M19 12H5M11 18l-6-6 6-6" />)
export const MenuIcon = make(<path d="M4 6h16M4 12h16M4 18h16" />)
export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>)
export const PencilIcon = make(<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></>)
export const TrashIcon = make(<>
  <path d="M3 6h18" />
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6" />
</>)
export const DotsIcon = make(<>
  <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
  <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  <circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none" />
</>)
export const FolderIcon = make(<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />)
export const LockIcon = make(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></>)
export const ImageIcon = make(<>
  <rect x="3" y="3" width="18" height="18" rx="2.5" />
  <circle cx="9" cy="9" r="1.8" />
  <path d="m21 15-4.5-4.5L6 21" />
</>)
export const DownloadIcon = make(<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />)
export const UploadIcon = make(<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14" />)
export const FlameIcon = make(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />)
export const CalendarIcon = make(<><rect x="3.5" y="4.5" width="17" height="16" rx="2" /><path d="M16 2.5v4M8 2.5v4M3.5 10h17" /></>)
export const EyeOffIcon = make(<>
  <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a17.5 17.5 0 0 1-2.16 3.19" />
  <path d="M6.61 6.61A17.4 17.4 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.39-1.61" />
  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24M2 2l20 20" />
</>)
export const InfoIcon = make(<><circle cx="12" cy="12" r="9.5" /><path d="M12 16.5v-5M12 8h.01" /></>)
export const AlertIcon = make(<><circle cx="12" cy="12" r="9.5" /><path d="M12 7.5v5.5M12 16.5h.01" /></>)
export const TagIcon = make(<>
  <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
  <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
</>)
export const PinIcon = make(<><path d="M12 16.5V22" /><path d="M8.5 3h7l-1 5.5 3 3.5v2h-11v-2l3-3.5z" /></>)
export const StarIcon = make(<path d="m12 2.8 2.84 5.76 6.36.92-4.6 4.49 1.08 6.33L12 17.3l-5.68 3 1.08-6.33-4.6-4.49 6.36-.92z" />)

export function StarFilledIcon({ size = 18, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path fill="currentColor" d="m12 2.8 2.84 5.76 6.36.92-4.6 4.49 1.08 6.33L12 17.3l-5.68 3 1.08-6.33-4.6-4.49 6.36-.92z" />
    </svg>
  )
}

/** App mark: a bookmark ribbon with a star — an achievement kept in a library. */
export function LogoMark({ size = 28, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="rgb(var(--c-accent))" />
      <path d="M10 7h12v18l-6-3.8L10 25z" fill="rgb(var(--c-on-accent))" />
      <path d="m16 10.2 1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="rgb(var(--c-accent))" />
    </svg>
  )
}
