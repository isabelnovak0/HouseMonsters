/** The illustrated parchment map used behind the collection (decorative). */
export function MapBackdrop({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width="390" height="844" fill="#f1e4c3" />
      <g fill="#e1ebc8">
        <path d="M20 150 C 90 120, 180 150, 190 220 S 100 300, 40 270 S -20 180, 20 150 Z" />
        <path d="M200 600 C 290 570, 390 600, 380 680 S 280 760, 220 720 S 150 630, 200 600 Z" />
      </g>
      <path d="M400 300 C 330 330, 300 400, 240 430 S 120 480, 110 560 S 60 680, -10 700" fill="none" stroke="#2b2a26" strokeWidth="16" strokeLinecap="round" />
      <path d="M400 300 C 330 330, 300 400, 240 430 S 120 480, 110 560 S 60 680, -10 700" fill="none" stroke="#9cc5d6" strokeWidth="11" strokeLinecap="round" />
      <ellipse cx="300" cy="170" rx="46" ry="28" fill="#9cc5d6" stroke="#2b2a26" strokeWidth="2.5" />
      <path d="M40 360 C 110 330, 160 400, 220 360 S 320 300, 360 260" fill="none" stroke="#8e6e46" strokeWidth="2.5" strokeDasharray="3 8" strokeLinecap="round" />
      <path d="M30 780 C 120 740, 200 800, 300 770" fill="none" stroke="#8e6e46" strokeWidth="2.5" strokeDasharray="3 8" strokeLinecap="round" />
      <g stroke="#2b2a26" strokeWidth="2.5" strokeLinejoin="round">
        <polygon points="250,520 285,460 320,520" fill="#c9b48a" />
        <polygon points="295,520 330,470 370,520" fill="#bca57a" />
      </g>
      <g stroke="#2b2a26" strokeWidth="2">
        <circle cx="44" cy="190" r="13" fill="#5e8c4a" /><circle cx="70" cy="176" r="11" fill="#4e7a3c" /><circle cx="96" cy="200" r="13" fill="#6e9c58" />
        <circle cx="260" cy="640" r="12" fill="#5e8c4a" /><circle cx="290" cy="628" r="11" fill="#4e7a3c" /><circle cx="320" cy="652" r="13" fill="#6e9c58" />
        <circle cx="340" cy="440" r="10" fill="#5e8c4a" /><circle cx="60" cy="640" r="11" fill="#4e7a3c" />
      </g>
      <g transform="translate(345 790)" stroke="#2b2a26" strokeWidth="2">
        <circle r="20" fill="#fffbf2" />
        <polygon points="0,-16 5,0 0,16 -5,0" fill="#c8452f" />
      </g>
    </svg>
  );
}
