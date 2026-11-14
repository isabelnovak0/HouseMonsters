/**
 * The storybook map behind the collection (decorative), painted in a flat
 * gouache style: a border of icon tiles, cream vine banners top and bottom, and
 * a green island map with a stepped river, clearings, pines, a pond with a
 * dock, a bridge and a treasure chest. Original artwork in the style of the
 * reference the user supplied. Portrait 390×844 to fill a phone screen.
 */

const W = 390;
const H = 844;
const SIDE = 44; // border tile column width
const BAND = 64; // top/bottom banner height
const INNER = { x: SIDE, y: BAND, w: W - SIDE * 2, h: H - BAND * 2 };

const C = {
  cream: "#f3e6c2",
  grassDark: "#4f9878",
  grassMid: "#6db089",
  clearing: "#a8d59d",
  river: "#6fb0da",
  riverEdge: "#4e8fbf",
  sand: "#f2e1a6",
  sandDot: "#e8a68c",
  pine: "#2f6b3f",
  pineLight: "#3f8350",
  trunk: "#6b3e2a",
  wood: "#7a4a35",
  woodLight: "#9b6446",
  brick: "#c4574a",
  flower: "#f2c53d",
  vine: "#3f8a6e",
  bell: "#7f9fd6",
  ribbon: "#d9704f",
  ink: "#2b2a26",
};

/* ---------- small painted icons for the border tiles (drawn in a 44×70 box) ---------- */

type Icon = (props: { cx: number; cy: number }) => React.ReactElement;

const Star: Icon = ({ cx, cy }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 6.5 : 15;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} fill="#f4cf48" />;
};

const Burst: Icon = ({ cx, cy }) => {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 ? 6 : 15;
    const a = (Math.PI / 8) * i;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} fill="#f4cf48" />;
};

const Tulip: Icon = ({ cx, cy }) => (
  <g>
    <path d={`M${cx} ${cy + 18} V${cy - 2}`} stroke={C.vine} strokeWidth={3} />
    <path d={`M${cx} ${cy + 10} q -10 -2 -12 6 q 8 2 12 -6`} fill={C.vine} />
    <path d={`M${cx - 9} ${cy - 12} q 0 14 9 14 q 9 0 9 -14 l -4.5 5 l -4.5 -6 l -4.5 6 z`} fill="#e0705f" />
  </g>
);

const Bluebell: Icon = ({ cx, cy }) => (
  <g fill="none" stroke={C.vine} strokeWidth={2.5} strokeLinecap="round">
    <path d={`M${cx - 6} ${cy + 22} C ${cx - 10} ${cy}, ${cx + 2} ${cy - 16}, ${cx + 10} ${cy - 18}`} />
    <path d={`M${cx - 4} ${cy + 4} q 6 0 8 6 M${cx} ${cy - 8} q 6 0 8 6`} />
    <path d={`M${cx + 3} ${cy + 10} l 3 5 l 3 -5 z M${cx + 7} ${cy - 2} l 3 5 l 3 -5 z M${cx + 9} ${cy - 18} l 3 5 l 3 -5 z`} fill={C.bell} stroke="none" />
  </g>
);

const Apple: Icon = ({ cx, cy }) => (
  <g>
    <path d={`M${cx} ${cy - 8} c -14 -8 -20 8 -14 18 c 4 8 10 8 14 4 c 4 4 10 4 14 -4 c 6 -10 0 -26 -14 -18 z`} fill="#d94b3c" />
    <path d={`M${cx} ${cy - 8} q 1 -7 4 -10`} stroke={C.trunk} strokeWidth={2.5} fill="none" />
    <path d={`M${cx + 3} ${cy - 13} q 8 -6 12 -1 q -6 5 -12 1`} fill={C.vine} />
  </g>
);

const Mushroom: Icon = ({ cx, cy }) => (
  <g>
    <path d={`M${cx - 4} ${cy} h 8 q 2 10 4 16 h -16 q 2 -6 4 -16 z`} fill="#f5ead2" />
    <path d={`M${cx - 15} ${cy + 2} q 0 -16 15 -16 q 15 0 15 16 z`} fill="#cf6e52" />
    <circle cx={cx - 5} cy={cy - 6} r={2} fill="#f5ead2" />
    <circle cx={cx + 6} cy={cy - 3} r={1.6} fill="#f5ead2" />
  </g>
);

const LilyPad: Icon = ({ cx, cy }) => (
  <g>
    <path d={`M${cx} ${cy} L ${cx + 14} ${cy - 4} A 14 14 0 1 1 ${cx + 10} ${cy - 10} Z`} fill="#4f9a62" />
    <path d={`M${cx} ${cy} l -8 -6 M${cx} ${cy} l -4 9 M${cx} ${cy} l 7 8`} stroke="#3c7a4c" strokeWidth={1.5} />
  </g>
);

const Tomato: Icon = ({ cx, cy }) => (
  <g>
    <circle cx={cx} cy={cy} r={15} fill="#de5940" />
    <path d={`M${cx} ${cy - 8} l 3 6 l 7 -1 l -5 5 l 3 7 l -8 -4 l -8 4 l 3 -7 l -5 -5 l 7 1 z`} fill="#3f8a6e" />
  </g>
);

const Sprig: Icon = ({ cx, cy }) => (
  <g fill={C.vine}>
    <path d={`M${cx} ${cy + 20} V${cy - 18}`} stroke={C.vine} strokeWidth={2.5} />
    {[-12, -2, 8].map((dy) => (
      <g key={dy}>
        <ellipse cx={cx - 6} cy={cy + dy} rx={6} ry={3} transform={`rotate(-30 ${cx - 6} ${cy + dy})`} />
        <ellipse cx={cx + 6} cy={cy + dy - 4} rx={6} ry={3} transform={`rotate(30 ${cx + 6} ${cy + dy - 4})`} />
      </g>
    ))}
  </g>
);

const LEFT_TILES: [string, Icon][] = [
  ["#f2cf6a", Sprig],
  ["#24456b", Burst],
  ["#f0d48a", Tomato],
  ["#a9d3c2", Tulip],
  ["#f2b9a8", Bluebell],
  ["#3f7f6e", Star],
  ["#b9d39a", Apple],
  ["#a9cfe0", Mushroom],
  ["#24456b", Star],
  ["#f2b9a8", LilyPad],
];
const RIGHT_TILES: [string, Icon][] = [
  ["#a9cfe0", Bluebell],
  ["#f2b9a8", LilyPad],
  ["#ecdcc0", Mushroom],
  ["#b9d39a", Apple],
  ["#24456b", Burst],
  ["#f2cf6a", Tulip],
  ["#a9d3c2", Sprig],
  ["#3f7f6e", Star],
  ["#f2b9a8", Tomato],
  ["#24456b", Burst],
];

function BorderColumn({ x, tiles }: { x: number; tiles: [string, Icon][] }) {
  const th = INNER.h / tiles.length;
  return (
    <g>
      {tiles.map(([bg, IconC], i) => (
        <g key={i}>
          <rect x={x} y={BAND + i * th} width={SIDE} height={th} fill={bg} />
          <IconC cx={x + SIDE / 2} cy={BAND + i * th + th / 2} />
        </g>
      ))}
    </g>
  );
}

function Banner({ y, flip }: { y: number; flip?: boolean }) {
  const x0 = SIDE;
  const w = W - SIDE * 2;
  const mid = y + BAND / 2;
  return (
    <g>
      <rect x={x0} y={y} width={w} height={BAND} fill={C.cream} />
      <g transform={flip ? `translate(${W} 0) scale(-1 1)` : undefined}>
        {/* curling vine with bluebells */}
        <path
          d={`M${x0 + 10} ${mid + 4} c 20 -18 34 10 50 -4 c 10 -9 2 -18 -6 -12 c -6 5 2 12 10 6 c 18 -14 34 14 52 -2 c 10 -9 2 -18 -6 -12 c -6 5 2 12 10 6 c 16 -12 26 4 36 -2`}
          fill="none"
          stroke={C.vine}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {[70, 132, 176].map((dx) => (
          <path key={dx} d={`M${x0 + dx} ${mid + 6} l 4 7 l 4 -7 z`} fill={C.bell} />
        ))}
        {/* pennant ribbon */}
        <path
          d={`M${x0 + 190} ${mid - 6} q 40 -10 104 -6 l -8 9 l 10 8 q -60 -2 -106 8 z`}
          fill={C.ribbon}
        />
        <path d={`M${x0 + 200} ${mid + 6} q 3 -6 6 0 q 3 6 6 0 q 3 -6 6 0 q 3 6 6 0 q 3 -6 6 0`} fill="none" stroke="#8f3e2a" strokeWidth={1.5} />
      </g>
    </g>
  );
}

function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-5} y={18} width={10} height={12} rx={3} fill={C.trunk} />
      <path d="M0 -32 L 16 -6 L 9 -6 L 22 10 L 13 10 L 26 24 L -26 24 L -13 10 L -22 10 L -9 -6 L -16 -6 Z" fill={C.pine} />
      <path d="M0 -32 L 8 -18 M-10 4 L 2 -2 M-14 18 L 4 12" stroke={C.pineLight} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

function Flower({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y + 3} v 9 M${x} ${y + 9} q -5 -4 -7 0 M${x} ${y + 8} q 5 -4 7 0`} stroke={C.vine} strokeWidth={1.8} fill="none" />
      <circle cx={x} cy={y} r={5} fill={C.flower} />
      <circle cx={x} cy={y} r={2} fill="#9b6a2a" />
    </g>
  );
}

function Sand({ d }: { d: string }) {
  return <path d={d} fill={C.sand} />;
}

export function MapBackdrop({ className }: { className?: string }) {
  const { x, y, w, h } = INNER;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className}>
      <defs>
        {/* soft wobble on painted edges */}
        <filter id="map-wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={4} />
        </filter>
        {/* gouache grain laid over everything */}
        <filter id="map-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={4} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.14  0 0 0 0 0.1  0 0 0 0.9 -0.3" />
        </filter>
      </defs>

      <g filter="url(#map-wobble)">
        {/* frame */}
        <rect width={W} height={H} fill={C.cream} />
        <Banner y={0} />
        <Banner y={H - BAND} flip />
        <BorderColumn x={0} tiles={LEFT_TILES} />
        <BorderColumn x={W - SIDE} tiles={RIGHT_TILES} />
        {[
          [0, 0],
          [W - SIDE, 0],
          [0, H - BAND],
          [W - SIDE, H - BAND],
        ].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <rect x={cx} y={cy} width={SIDE} height={BAND} fill="#3f7f6e" />
            <Star cx={cx + SIDE / 2} cy={cy + BAND / 2} />
          </g>
        ))}

        {/* the island */}
        <rect x={x} y={y} width={w} height={h} fill={C.grassDark} />
        {/* brush strokes on the dark grass */}
        <g stroke={C.grassMid} strokeWidth={3} strokeLinecap="round" opacity={0.7}>
          {[
            [70, 300], [60, 610], [300, 120], [320, 470], [180, 740], [290, 735], [62, 470], [150, 182],
          ].map(([sx, sy], i) => (
            <path key={i} d={`M${sx} ${sy} l 14 -4 M${sx + 4} ${sy + 6} l 12 -3`} />
          ))}
        </g>

        {/* clearings (lighter meadow), stepped like the reference */}
        <path d="M150 300 H246 V250 H330 V530 H150 Z" fill={C.clearing} />
        <path d="M124 568 H330 V712 H124 Z" fill={C.clearing} />
        <path d="M264 64 H316 V250 H264 Z" fill={C.clearing} />
        <path d="M66 92 H132 V160 H66 Z" fill={C.clearing} />
        <path d="M150 300 H130 V420 H150 Z" fill={C.clearing} />

        {/* stepped river */}
        <path
          d={`M218 ${y} V150 H162 V242 H98 V560 H74 V${y + h}`}
          fill="none"
          stroke={C.riverEdge}
          strokeWidth={36}
          strokeLinejoin="round"
        />
        <path
          d={`M218 ${y} V150 H162 V242 H98 V560 H74 V${y + h}`}
          fill="none"
          stroke={C.river}
          strokeWidth={28}
          strokeLinejoin="round"
        />
        <path d="M214 96 v 30 M158 180 v 26 M94 300 v 40 M94 430 v 30" stroke="#a9d3ec" strokeWidth={3} strokeLinecap="round" />

        {/* sandy patches with pebbles */}
        <Sand d="M162 330 q 4 -16 26 -12 q 12 -14 30 -2 q 20 -2 18 16 q 12 10 -2 22 q -6 14 -26 8 q -16 10 -32 -2 q -18 0 -14 -16 q -10 -8 0 -14 z" />
        <Sand d="M280 372 q 0 -16 18 -14 q 22 -4 22 18 q 10 14 0 32 q 8 18 -8 30 q -16 10 -28 0 q -16 -4 -12 -22 q -8 -16 8 -22 z" />
        <Sand d="M276 82 q 10 -10 24 -2 q 8 10 -4 16 q -14 6 -20 -4 z" />
        <Sand d="M280 140 q 12 -10 24 0 q 6 12 -8 16 q -18 2 -16 -16 z" />
        <Sand d="M276 200 q 10 -8 22 -2 q 8 10 -6 14 q -16 2 -16 -12 z" />
        <Sand d="M172 610 q 14 -10 28 0 q 6 12 -10 16 q -20 2 -18 -16 z" />
        <g fill={C.sandDot}>
          <circle cx={186} cy={336} r={2} /><circle cx={210} cy={344} r={1.6} /><circle cx={196} cy={356} r={1.8} />
          <circle cx={298} cy={392} r={2} /><circle cx={306} cy={418} r={1.6} /><circle cx={290} cy={436} r={1.8} />
          <circle cx={288} cy={88} r={1.6} /><circle cx={292} cy={146} r={1.6} />
        </g>

        {/* pond + dock */}
        <path d="M206 436 H262 Q 268 436 268 442 V478 Q 268 486 260 486 H212 Q 206 486 206 478 Z" fill={C.river} />
        <path d="M206 470 H262" stroke={C.riverEdge} strokeWidth={3} opacity={0.6} />
        <g fill={C.wood}>
          <rect x={174} y={452} width={46} height={18} />
          <rect x={170} y={436} width={10} height={8} fill={C.woodLight} />
        </g>
        <path d="M184 452 v 18 M194 452 v 18 M204 452 v 18 M214 452 v 18" stroke="#5a3424" strokeWidth={1.5} />

        {/* bridge across the channel between the meadows */}
        <rect x={252} y={526} width={34} height={46} fill={C.brick} />
        <path d="M252 536 h 34 M252 546 h 34 M252 556 h 34" stroke="#8f3e2a" strokeWidth={2} />
        <rect x={248} y={526} width={4} height={46} fill={C.cream} />
        <rect x={286} y={526} width={4} height={46} fill={C.cream} />

        {/* treasure chest */}
        <g>
          <rect x={268} y={652} width={30} height={20} rx={2} fill={C.wood} />
          <path d="M268 660 h 30" stroke="#5a3424" strokeWidth={2} />
          <rect x={279} y={656} width={8} height={8} fill="#f2c53d" />
        </g>

        {/* pines */}
        <Pine x={99} y={118} s={0.95} />
        <Pine x={300} y={290} />
        <Pine x={318} y={612} s={0.8} />

        {/* flowers & tufts */}
        {[
          [196, 286], [312, 500], [166, 500], [140, 690], [184, 690], [228, 702], [300, 700], [222, 596], [236, 392],
        ].map(([fx, fy]) => (
          <Flower key={`${fx}-${fy}`} x={fx} y={fy} />
        ))}
        <g stroke="#3f8a5a" strokeWidth={2} strokeLinecap="round">
          {[
            [176, 520], [312, 330], [140, 600], [250, 690], [120, 196], [300, 540],
          ].map(([tx, ty]) => (
            <path key={`${tx}-${ty}`} d={`M${tx} ${ty} l -2 -6 M${tx + 4} ${ty} l 0 -7 M${tx + 8} ${ty} l 2 -6`} />
          ))}
        </g>
      </g>

      {/* paper/gouache grain */}
      <rect width={W} height={H} filter="url(#map-grain)" opacity={0.55} />
    </svg>
  );
}

/** The walkable part of the map, as % of the screen, for the roaming monsters. */
export const ROAM_AREA = {
  left: (INNER.x / W) * 100,
  right: ((INNER.x + INNER.w) / W) * 100,
  top: (INNER.y / H) * 100,
  bottom: ((INNER.y + INNER.h) / H) * 100,
};
