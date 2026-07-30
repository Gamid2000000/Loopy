type Props = { size?: number };
function Svg({ children, size = 18 }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
export function PlusIcon(props: Props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}
export function MoreIcon(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </Svg>
  );
}
export function EditIcon(props: Props) {
  return (
    <Svg {...props}>
      <path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m14 6 4 4" />
    </Svg>
  );
}
export function ArchiveIcon(props: Props) {
  return (
    <Svg {...props}>
      <path d="M3 7h18v13H3zM2 3h20v4H2zM10 12h4" />
    </Svg>
  );
}
export function RestoreIcon(props: Props) {
  return (
    <Svg {...props}>
      <path d="M4 7h16v13H4zM8 3v8m0 0-3-3m3 3 3-3" />
    </Svg>
  );
}
export function CardsIcon(props: Props) {
  return (
    <Svg {...props}>
      <rect x="4" y="5" width="12" height="14" rx="1" />
      <path d="M8 3h12v14" />
    </Svg>
  );
}
