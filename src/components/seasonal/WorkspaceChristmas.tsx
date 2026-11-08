"use client";

import { useFestiveTheme } from './FestiveTheme';

function HolidayGarland({ className }: { className?: string }) {
  return <svg viewBox="0 0 600 150" preserveAspectRatio="xMaxYMid slice" fill="none" aria-hidden="true" focusable="false" className={className}>
    <path d="M0 9c125 64 265-24 393 10s139 9 207-3" stroke="#a78b54" strokeWidth="1.5" />
    {[45, 103, 170, 239, 307, 373, 441, 507, 568].map((x, i) => <g key={x}>
      <path d={`M${x} ${i < 3 ? 27 : 23}v8`} stroke="#b49760" />
      <circle cx={x} cy={i < 3 ? 39 : 35} r="7" fill="#e8c784" opacity=".08" />
      <circle cx={x} cy={i < 3 ? 39 : 35} r="2.8" fill="#f4d896" />
    </g>)}
    <g fill="#456a46" stroke="#79945b" strokeWidth="1">
      <path d="M600 6c-47 29-71 35-126 38m77-26c0-17 16-18 16-18 3 15-11 19-16 18m-17 7c-11-16-23-12-23-12 4 16 17 15 23 12m-30 10c-10-13-23-9-23-9 6 14 18 12 23 9m49-18c17 2 22 13 22 13-16 6-22-7-22-13m-29 13c16 4 18 16 18 16-17 3-19-10-18-16m-24 8c14 3 17 13 17 13-13 5-19-7-17-13" />
      <path d="M150 10c-36 20-65 23-110 19m75-6c2-14 14-15 14-15 1 13-10 15-14 15m-23 4c-10-13-20-7-20-7 6 12 15 10 20 7m23-4c12 3 15 14 15 14-13 3-16-8-15-14m-33 5c11 7 10 16 10 16-14 0-15-11-10-16" />
    </g>
    <g fill="#be5c48"><circle cx="511" cy="31" r="4" /><circle cx="518" cy="36" r="3.5" /><circle cx="506" cy="39" r="3" /><circle cx="95" cy="27" r="3" /></g>
    <g transform="translate(410 45)">
      <path d="M26-18V0" stroke="#c8a66a" /><path d="m26 0 22 14-4 45-18 11L8 59 4 14z" fill="#934f3d" stroke="#d6af70" />
      <path d="m26 0-5 17 5 53 5-53zM4 14l17 3h10l17-3M8 59l18-5 18 5" stroke="#c88f62" />
      <path d="m26 24 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#f0d298" />
      <path d="m21 70-4 10m9-10v13m5-13 4 10" stroke="#bda16c" />
    </g>
    <g transform="translate(520 51)">
      <path d="M20-22V0" stroke="#c8a66a" /><path d="m20 0 18 11-3 37-15 9L5 48 2 11z" fill="#2e6348" stroke="#c2ad77" />
      <path d="m20 0-4 14 4 43 4-43zM2 11l14 3h8l14-3M5 48l15-4 15 4" stroke="#91a474" />
      <path d="m20 20 2 6 7 1-5 4 1 7-5-3-5 3 1-7-5-4 7-1z" fill="#f0d298" />
      <path d="m16 57-3 9m7-9v12m4-12 3 9" stroke="#bda16c" />
    </g>
    <g transform="translate(296 72)">
      <ellipse cx="27" cy="62" rx="47" ry="8" fill="#ab864c" opacity=".18" />
      <path d="M0 37h13v26H0zM22 23h14v40H22zM45 42h12v21H45z" fill="#d1b584" />
      <g fill="#f5d59a"><path d="M6 35c-8-7-2-12 0-18 5 7 9 13 0 18z" /><path d="M29 21c-8-7-2-12 0-18 5 7 9 13 0 18z" /><path d="M51 40c-7-6-2-11 0-16 5 6 8 12 0 16z" /></g>
    </g>
    <path d="m223 64 2 7 7 2-7 2-2 7-2-7-7-2 7-2zm354 50 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ddbb76" opacity=".75" />
    <path d="m488 18-15-9c-13-6-16 8-3 10l18-1 18-1c13-2 10-16-3-10zm-1 0-7 20 9-5 7 5-6-20" fill="#a54b3c" stroke="#c47656" />
  </svg>;
}

export function WorkspaceChristmasBanner() {
  const { enabled } = useFestiveTheme();
  if (!enabled) return null;
  return <section aria-label="Navidad en La Cabaña" className="christmas-only workspace-christmas-banner">
    <div className="relative z-10 min-w-0">
      <p className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-[.19em] text-[#d5bf8d]"><span className="holiday-colombia-mark" aria-hidden="true" /> Tradición que nos reúne</p>
      <p className="font-headline text-[19px] sm:text-[23px] leading-tight text-[#fff0d7] mt-1">Navidad en La Cabaña</p>
    </div>
    <HolidayGarland className="workspace-christmas-art" />
  </section>;
}

export function WorkspaceChristmasEdges() {
  const { enabled } = useFestiveTheme();
  if (!enabled) return null;
  return <div className="christmas-only workspace-christmas-edges" aria-hidden="true">
    {[false, true].map(right => <svg key={String(right)} viewBox="0 0 110 300" fill="none" focusable="false" className={right ? 'workspace-edge-right' : 'workspace-edge-left'}>
      <path d="M18 0c-9 77 55 91 36 161S8 241 24 300" stroke="#728358" strokeWidth="1.5" />
      <g fill="#36543c" stroke="#6d8454"><path d="M22 28C3 14 0 32 22 39c22-20 32-2 0 8m11 19C9 55 13 77 37 79c15-26 32-12 7 12m11 39c-26-8-24 12-3 16 23-20 29-1-6 13m-12 42c-20-17-29 4-7 14 22-15 33 5-8 17m2 30c-20-7-22 10 3 15 20-21 33-5 4 10" /></g>
      {[{ x: 22, y: 51 }, { x: 50, y: 167 }, { x: 17, y: 241 }].map(({ x, y }) => <g key={y}><circle cx={x} cy={y} r="7" fill="#f0cb80" opacity=".08" /><circle cx={x} cy={y} r="2.5" fill="#edcb83" /><circle cx={x + 7} cy={y + 6} r="3" fill="#a95843" /></g>)}
      <path d="M47 79v18m-14 0h28l6 38-20 12-20-12 6-38z" fill="#714632" stroke="#c0a36a" />
      <path d="m47 108 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#e8c486" />
    </svg>)}
  </div>;
}
