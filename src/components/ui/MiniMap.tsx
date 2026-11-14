/* eslint-disable @next/next/no-img-element */
import type { GeoPoint } from "@/lib/types";

const ZOOM = 17;
const TILE = 256;

/** Small static map with a pin, built from OpenStreetMap tiles (D-015). */
export function MiniMap({ point, className }: { point: GeoPoint; className?: string }) {
  const n = 2 ** ZOOM;
  const x = ((point.lng + 180) / 360) * n;
  const latRad = (point.lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  // pixel offset of the point inside its tile
  const px = (x - tx) * TILE;
  const py = (y - ty) * TILE;

  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push(
        <img
          key={`${dx},${dy}`}
          src={`https://tile.openstreetmap.org/${ZOOM}/${tx + dx}/${ty + dy}.png`}
          alt=""
          width={TILE}
          height={TILE}
          draggable={false}
          style={{ position: "absolute", left: (dx + 1) * TILE, top: (dy + 1) * TILE }}
        />,
      );
    }
  }

  return (
    <div className={`relative overflow-hidden bg-[#ede3cb] ${className ?? ""}`} role="img" aria-label="Map of the house location">
      <div
        className="absolute"
        style={{ left: "50%", top: "50%", transform: `translate(${-(TILE + px)}px, ${-(TILE + py)}px)`, width: TILE * 3, height: TILE * 3 }}
      >
        {tiles}
      </div>
      <svg aria-hidden="true" viewBox="0 0 24 32" className="absolute left-1/2 top-1/2 h-8 w-6 -translate-x-1/2 -translate-y-full">
        <path d="M12 31 C 4 20 2 15 2 11 a 10 10 0 0 1 20 0 c 0 4 -2 9 -10 20 z" fill="#c8452f" stroke="#2b2a26" strokeWidth="2" />
        <circle cx="12" cy="11" r="3.5" fill="#fffbf2" />
      </svg>
      <span className="absolute bottom-0 right-0 bg-white/80 px-1 text-[9px] text-ink">© OpenStreetMap contributors</span>
    </div>
  );
}
