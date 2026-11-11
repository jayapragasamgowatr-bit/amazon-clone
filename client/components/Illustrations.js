// ============================================================
// ILLUSTRATIONS
// ============================================================
// Original line illustrations drawn for this site (inline SVG, so
// they stay sharp at any size and need no image files). Swap any of
// them for a real photo later by replacing the component with <img>.
// ============================================================

const frame = {
  viewBox: "0 0 320 220",
  fill: "none",
  role: "img",
  xmlns: "http://www.w3.org/2000/svg",
};

function Defs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-accent`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#22d3ee" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id={`${id}-soft`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#38bdf8" stopOpacity="0.28" />
        <stop offset="1" stopColor="#6366f1" stopOpacity="0.04" />
      </linearGradient>
    </defs>
  );
}

// A pipeline with an inline meter and a live reading.
export function FlowIllustration({ className, title = "Flow meter on a pipeline with a live reading" }) {
  const id = "ill-flow";
  return (
    <svg {...frame} className={className} aria-label={title}>
      <Defs id={id} />
      <rect x="16" y="16" width="288" height="188" rx="24" fill={`url(#${id}-soft)`} />
      {/* pipe */}
      <rect x="28" y="118" width="96" height="34" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
      <rect x="196" y="118" width="96" height="34" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
      <rect x="116" y="110" width="12" height="50" rx="3" fill="#334155" />
      <rect x="192" y="110" width="12" height="50" rx="3" fill="#334155" />
      {/* meter body */}
      <rect x="128" y="104" width="64" height="62" rx="12" fill="#0b1228" stroke={`url(#${id}-accent)`} strokeWidth="3" />
      <rect x="150" y="78" width="20" height="28" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
      {/* display */}
      <rect x="118" y="34" width="84" height="48" rx="10" fill="#0b1228" stroke={`url(#${id}-accent)`} strokeWidth="3" />
      <path d="M130 66l10-10 9 6 11-14 10 9 10-6" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* flow */}
      <path d="M40 135h56M224 135h56" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10" />
      <path d="M272 129l8 6-8 6" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* signal */}
      <path d="M222 44a22 22 0 0 1 0 28M234 34a38 38 0 0 1 0 48" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="212" cy="58" r="4" fill="#818cf8" />
    </svg>
  );
}

// A parcel travelling along a route to a map pin.
export function DeliveryIllustration({ className, title = "Parcel on its way to a delivery address" }) {
  const id = "ill-delivery";
  return (
    <svg {...frame} className={className} aria-label={title}>
      <Defs id={id} />
      <rect x="16" y="16" width="288" height="188" rx="24" fill={`url(#${id}-soft)`} />
      <path d="M56 168c40-4 52-40 92-40s46 28 84 20" stroke="#475569" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 11" />
      {/* parcel */}
      <path d="M64 96l44-20 44 20v48l-44 20-44-20z" fill="#0b1228" stroke={`url(#${id}-accent)`} strokeWidth="3" strokeLinejoin="round" />
      <path d="M64 96l44 20 44-20M108 116v48" stroke={`url(#${id}-accent)`} strokeWidth="3" strokeLinejoin="round" />
      <path d="M86 86l44 20v16" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* pin */}
      <path d="M244 60c-16 0-28 12-28 27 0 20 28 47 28 47s28-27 28-47c0-15-12-27-28-27z" fill="#0b1228" stroke="#818cf8" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="244" cy="88" r="9" fill="#818cf8" />
      <ellipse cx="244" cy="150" rx="18" ry="5" fill="#6366f1" opacity="0.3" />
    </svg>
  );
}

// A parcel with a return arrow looping around it.
export function ReturnsIllustration({ className, title = "Parcel with a return arrow" }) {
  const id = "ill-returns";
  return (
    <svg {...frame} className={className} aria-label={title}>
      <Defs id={id} />
      <rect x="16" y="16" width="288" height="188" rx="24" fill={`url(#${id}-soft)`} />
      <path d="M116 92l44-20 44 20v48l-44 20-44-20z" fill="#0b1228" stroke={`url(#${id}-accent)`} strokeWidth="3" strokeLinejoin="round" />
      <path d="M116 92l44 20 44-20M160 112v48" stroke={`url(#${id}-accent)`} strokeWidth="3" strokeLinejoin="round" />
      <path d="M236 150a84 62 0 1 1 6-66" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
      <path d="M248 62l-5 23-22-8" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="238" cy="160" r="15" fill="#0b1228" stroke="#4ade80" strokeWidth="3" />
      <path d="M231 160l5 5 9-10" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Two chat bubbles: a customer question and an answer.
export function SupportIllustration({ className, title = "A question and an answer in chat bubbles" }) {
  const id = "ill-support";
  return (
    <svg {...frame} className={className} aria-label={title}>
      <Defs id={id} />
      <rect x="16" y="16" width="288" height="188" rx="24" fill={`url(#${id}-soft)`} />
      <path d="M52 52h132a14 14 0 0 1 14 14v40a14 14 0 0 1-14 14H96l-24 20v-20H52a14 14 0 0 1-14-14V66a14 14 0 0 1 14-14z" fill="#0b1228" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
      <path d="M62 76h96M62 94h64" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
      <path d="M150 104h118a14 14 0 0 1 14 14v36a14 14 0 0 1-14 14h-20v20l-24-20h-74a14 14 0 0 1-14-14v-36a14 14 0 0 1 14-14z" fill="#0b1228" stroke={`url(#${id}-accent)`} strokeWidth="3" strokeLinejoin="round" />
      <path d="M160 128h100M160 146h70" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
