import type { Appearance } from "@/engine";

/**
 * Layered placeholder avatar drawn entirely in SVG (original work).
 * Each layer is keyed by an appearance id, so commissioned art can replace a
 * layer by swapping its entry here without touching saved characters.
 */
const HAIR: Record<string, (c: string) => React.ReactNode> = {
  "low-cut": (c) => <path d="M34 44c0-17 12-26 26-26s26 9 26 26c-6-9-14-13-26-13s-20 4-26 13z" fill={c} />,
  afro: (c) => <path d="M22 48c-4-22 14-38 38-38s42 16 38 38c-3-8-6-12-11-15-7-6-16-8-27-8s-20 2-27 8c-5 3-8 7-11 15z" fill={c} />,
  braids: (c) => (
    <g fill={c}>
      <path d="M32 46c0-18 12-28 28-28s28 10 28 28c-6-10-15-14-28-14s-22 4-28 14z" />
      {[30, 36, 84, 90].map((x) => <rect key={x} x={x - 2} y="44" width="5" height="40" rx="2.5" />)}
    </g>
  ),
  locs: (c) => (
    <g fill={c}>
      <path d="M32 46c0-18 12-28 28-28s28 10 28 28c-6-10-15-14-28-14s-22 4-28 14z" />
      {[28, 34, 40, 80, 86, 92].map((x, i) => <rect key={x} x={x - 3} y="40" width="6" height={24 + (i % 3) * 5} rx="3" />)}
    </g>
  ),
  puff: (c) => (
    <g fill={c}>
      <circle cx="60" cy="14" r="14" />
      <path d="M34 44c0-16 12-24 26-24s26 8 26 24c-6-8-14-11-26-11s-20 3-26 11z" />
    </g>
  ),
  fade: (c) => (
    <g>
      <path d="M36 42c0-15 11-22 24-22s24 7 24 22c-6-7-13-10-24-10s-18 3-24 10z" fill={c} />
      <path d="M34 50c0-5 1-9 3-12l2 14zM86 50c0-5-1-9-3-12l-2 14z" fill={c} opacity=".45" />
    </g>
  ),
  cornrows: (c) => (
    <g>
      <path d="M34 44c0-17 12-26 26-26s26 9 26 26c-6-9-14-13-26-13s-20 4-26 13z" fill={c} />
      {[46, 53, 60, 67, 74].map((x) => <path key={x} d={`M${x} 19v13`} stroke="#fff" strokeOpacity=".28" strokeWidth="1.5" />)}
    </g>
  ),
  headwrap: () => (
    <g>
      <path d="M30 44c-2-20 12-32 30-32s32 12 30 32c-8-8-18-11-30-11s-22 3-30 11z" fill="#e0a526" />
      <path d="M32 36c9-7 18-9 28-9s19 2 28 9" stroke="#b8452f" strokeWidth="4" fill="none" />
      <path d="M38 24c7-4 14-6 22-6s15 2 22 6" stroke="#17695d" strokeWidth="3" fill="none" />
      <circle cx="84" cy="20" r="8" fill="#e0a526" stroke="#b8452f" strokeWidth="3" />
    </g>
  ),
};

function Outfit({ id, color }: { id: string; color: string }) {
  const body = <path d="M18 120c2-22 18-32 42-32s40 10 42 32z" fill={color} />;
  switch (id) {
    case "kente-trim-shirt":
      return <g>{body}<path d="M46 89l14 12 14-12" fill="none" stroke="#e0a526" strokeWidth="5" /><path d="M46 89l14 12 14-12" fill="none" stroke="#17695d" strokeWidth="5" strokeDasharray="4 6" /></g>;
    case "campus-hoodie":
      return <g>{body}<path d="M42 90c4 10 32 10 36 0" fill="none" stroke="#000" strokeOpacity=".25" strokeWidth="5" /><path d="M56 100v12M64 100v12" stroke="#fff" strokeWidth="2" /><text x="60" y="117" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fillOpacity=".85">AMU</text></g>;
    case "smock":
      return <g>{body}{[30, 42, 54, 66, 78, 90].map((x) => <path key={x} d={`M${x} 92v28`} stroke="#fff" strokeOpacity=".5" strokeWidth="3" />)}<path d="M50 89h20l-10 12z" fill="#fff" fillOpacity=".7" /></g>;
    case "print-dress":
      return <g>{body}{[[34, 104], [50, 112], [70, 104], [86, 112], [60, 98]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#e0a526" />)}<path d="M48 89c4 6 20 6 24 0" fill="none" stroke="#fff" strokeWidth="3" /></g>;
    case "blazer":
      return <g>{body}<path d="M50 89l10 30 10-30z" fill="#fff" /><path d="M50 89l10 18-14 6zM70 89l-10 18 14 6z" fill="#000" fillOpacity=".25" /></g>;
    default: // polo
      return <g>{body}<path d="M50 89l10 9 10-9-4 14h-12z" fill="#fff" fillOpacity=".85" /><path d="M60 98v10" stroke="#000" strokeOpacity=".3" strokeWidth="1.5" /></g>;
  }
}

function Accessory({ id }: { id: string }) {
  switch (id) {
    case "glasses":
      return <g fill="none" stroke="#1b1b1b" strokeWidth="2.5"><circle cx="50" cy="52" r="7" /><circle cx="70" cy="52" r="7" /><path d="M57 52h6" /></g>;
    case "headphones":
      return <g><path d="M34 54c0-36 52-36 52 0" fill="none" stroke="#23314f" strokeWidth="4" /><rect x="29" y="48" width="9" height="16" rx="4" fill="#23314f" /><rect x="82" y="48" width="9" height="16" rx="4" fill="#23314f" /></g>;
    case "beads":
      return <g>{[46, 51, 56, 61, 66, 71, 76].map((x, i) => <circle key={x} cx={x - 1} cy={86 + Math.round(4 - Math.abs(3 - i) * 1.3)} r="2.6" fill={i % 2 ? "#e0a526" : "#b8452f"} />)}</g>;
    case "cap":
      return <g><path d="M34 40c0-16 12-24 26-24s26 8 26 24z" fill="#23314f" /><path d="M30 40h44c6 0 10 2 12 6H30z" fill="#17695d" /></g>;
    default:
      return null;
  }
}

export function Avatar({ appearance, size = 120, label }: { appearance: Appearance; size?: number; label?: string }) {
  const { skinTone, hairstyle, hairColor, outfit, outfitColor, accessory } = appearance;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={label ?? "Your student avatar"} className="rounded-3xl bg-sand-deep">
      <circle cx="60" cy="60" r="56" fill="#fff" fillOpacity=".5" />
      <Outfit id={outfit} color={outfitColor} />
      <rect x="52" y="72" width="16" height="20" rx="7" fill={skinTone} />
      <ellipse cx="34" cy="54" rx="4" ry="6" fill={skinTone} />
      <ellipse cx="86" cy="54" rx="4" ry="6" fill={skinTone} />
      <ellipse cx="60" cy="52" rx="25" ry="29" fill={skinTone} />
      <circle cx="50" cy="52" r="2.6" fill="#1b120c" />
      <circle cx="70" cy="52" r="2.6" fill="#1b120c" />
      <path d="M51 65c5 5 13 5 18 0" fill="none" stroke="#1b120c" strokeOpacity=".75" strokeWidth="2.4" strokeLinecap="round" />
      {accessory !== "cap" && (HAIR[hairstyle] ?? HAIR["low-cut"])(hairColor)}
      <Accessory id={accessory} />
    </svg>
  );
}
