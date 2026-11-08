"use client";

import { Flame } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export function ChristmasBrand({ className }: { className?: string }) {
  return <div className={cn('christmas-brand relative flex shrink-0 items-center justify-center', className)}>
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" className="christmas-only absolute inset-0 h-full w-full">
      <circle cx="50" cy="50" r="43" fill="none" stroke="#b9a074" strokeOpacity=".65" strokeWidth="1" />
      <g fill="none" stroke="#60785a" strokeWidth="2.5" strokeLinecap="round">
        <path d="M43 87C9 78 9 38 29 19M57 87c34-9 34-49 14-68" />
        <path d="m25 28-9 2m9-2-1-10m-5 26-10 2m10-2-4-10m4 27-10-1m10 1-6-9m13 25-10-1m10 1-5-11m54-38 9 2m-9-2 1-10m5 26 10 2m-10-2 4-10m-4 27 10-1m-10 1 6-9m-13 25 10-1m-10 1 5-11" />
      </g>
      <g fill="#b55743"><circle cx="23" cy="66" r="3" /><circle cx="77" cy="66" r="3" /><circle cx="73" cy="30" r="2.5" /></g>
      <path d="M50 83c-15-12-22-3-13 3l13-3c15-12 22-3 13 3l-13-3-6 12 6-3 6 3z" fill="#9b493b" />
      <path d="m50 9 1.5 4 4 .5-3 2.7.8 4-3.3-2-3.3 2 .8-4-3-2.7 4-.5z" fill="#e0c68d" />
    </svg>
    <Flame className="relative h-[44%] w-[44%] text-primary" aria-hidden="true" />
  </div>;
}

/** Farolitos, velitas and tropical foliage: static details reserved for the welcome screen. */
export function ColombianChristmasScene() {
  const id = useId().replace(/:/g, '');
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 560 300" className="christmas-only christmas-scene w-full" fill="none">
    <defs>
      <radialGradient id={`${id}-glow`}><stop stopColor="#e8c27d" stopOpacity=".18" /><stop offset="1" stopColor="#e8c27d" stopOpacity="0" /></radialGradient>
      <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d5b477" /><stop offset="1" stopColor="#785337" /></linearGradient>
    </defs>
    <ellipse cx="315" cy="213" rx="220" ry="84" fill={`url(#${id}-glow)`} />
    <path d="M20 42C190 101 368 4 542 36" stroke="#b9a074" strokeOpacity=".45" />
    {[50, 115, 185, 255, 325, 395, 465, 530].map((x, i) => <g key={x}><path d={`M${x} ${i < 3 ? 51 : 35}v8`} stroke="#b9a074" strokeOpacity=".6" /><circle cx={x} cy={i < 3 ? 61 : 45} r="2.5" fill="#e9ca8c" /></g>)}
    <path d="M124 63v41m312-61v52" stroke="#b9a074" strokeOpacity=".6" />
    <g transform="translate(81 103)">
      <path d="m43 0 34 19-7 69-27 15-27-15-7-69z" fill="#263c32" stroke="#8d9b71" />
      <path d="m43 0-9 23 9 80 9-80zm-34 19 25 4 18 0 25-4M16 88l27-6 27 6" stroke="#9ea57b" strokeOpacity=".7" />
      <path d="m43 37 4 10 11 1-9 7 3 11-9-6-9 6 3-11-9-7 11-1z" fill="#d8bd7b" />
      <path d="m37 103-4 16m10-16v20m6-20 4 16" stroke="#a48756" />
    </g>
    <g transform="translate(400 95)">
      <path d="m36 0 30 16-6 60-24 13-24-13-6-60z" fill="#703b31" stroke="#bc8763" />
      <path d="m36 0-7 20 7 69 7-69zM6 16l23 4h14l23-4M12 76l24-5 24 5" stroke="#bb8b63" />
      <path d="m36 32 3 8 9 1-7 6 2 9-7-5-7 5 2-9-7-6 9-1z" fill="#e1bd7a" />
      <path d="m31 89-4 13m9-13v17m5-17 4 13" stroke="#a48756" />
    </g>
    <g stroke="#6b805a" strokeWidth="1.3" opacity=".85">
      <path d="M35 275c32-34 40-48 52-91m-33 70c-23-1-25-13-25-13 17-5 24 5 25 13m9-14c-21-4-21-16-21-16 17-1 21 10 21 16m10-20c-18-8-16-20-16-20 16 2 17 13 16 20m7-21c5-16 17-17 17-17 0 15-11 19-17 17m-12 32c7-17 19-16 19-16-2 15-14 18-19 16m-13 22c10-15 21-12 21-12-5 14-17 15-21 12" fill="#304330" />
      <path d="M514 275c-27-29-37-53-43-86m29 63c23-3 23-16 23-16-17-3-23 9-23 16m-12-21c20-6 18-18 18-18-16 1-19 12-18 18m-10-20c17-10 13-22 13-22-15 4-15 16-13 22m7 28c-9-15-20-12-20-12 4 14 16 15 20 12m12 23c-11-13-22-9-22-9 6 13 18 12 22 9" fill="#304330" />
    </g>
    <path d="M104 267h349" stroke="#ba9860" strokeOpacity=".4" />
    {[{ x: 219, y: 210, h: 52 }, { x: 270, y: 185, h: 77 }, { x: 320, y: 223, h: 39 }].map(({ x, y, h }) => <g key={x}>
      <rect x={x - 5} y={y} width="17" height={h} rx="3" fill="#b8a17a" /><rect x={x - 5} y={y} width="5" height={h} rx="2" fill="#dac39b" />
      <ellipse cx={x + 3} cy={y - 4} rx="21" ry="29" fill={`url(#${id}-glow)`} />
      <path d={`M${x + 3} ${y - 2}c-9-6-3-12 0-18 5 8 10 13 0 18z`} fill="#efd59c" />
      <path d={`M${x + 3} ${y - 1}v4`} stroke="#765b3e" />
    </g>)}
    <path d="M199 265h149m-136 7h123" stroke="#ba9860" strokeOpacity=".55" />
    <path d="m135 280 9 5 9-5 9 5 9-5m211 0 9 5 9-5 9 5 9-5" stroke="#a38b5c" strokeOpacity=".6" />
  </svg>;
}
