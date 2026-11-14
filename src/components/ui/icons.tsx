/** Inline stroke icons (decorative; buttons carry their own labels). */
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const CameraIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...base}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
);
export const HomeIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...base}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></svg>
);
export const BackIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...base}><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></svg>
);
export const CloseIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const PinIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...base}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const SendIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...base}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></svg>
);
export const GalleryIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...base}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 8" /></svg>
);
export const StarIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" /></svg>
);
export const CheckIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...base} strokeWidth={3}><path d="M5 12l5 5 9-10" /></svg>
);
export const TrashIcon = ({ className }: P) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...base}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></svg>
);
