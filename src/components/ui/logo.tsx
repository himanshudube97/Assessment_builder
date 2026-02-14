interface AssessioLogoProps {
  className?: string;
}

export function AssessioLogo({ className = 'w-5 h-5' }: AssessioLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16 4 L9 22 L12.5 22 L14.2 17.5 L17.8 17.5 L19.5 22 L23 22 L16 4Z"
        fill="currentColor"
        opacity="0.95"
      />
      <circle cx="10" cy="25" r="2.2" fill="currentColor" opacity="0.6" />
      <circle cx="22" cy="25" r="2.2" fill="currentColor" opacity="0.6" />
      <line
        x1="13.5"
        y1="16"
        x2="10"
        y2="25"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.4"
        strokeLinecap="round"
      />
      <line
        x1="18.5"
        y1="16"
        x2="22"
        y2="25"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
