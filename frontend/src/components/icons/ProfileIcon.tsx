import type { SVGProps } from "react";
export function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 21c.5-4 2.8-6 7-6s6.5 2 7 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
