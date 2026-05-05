interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="60" height="60" rx="12" fill="currentColor" />
      <g fill="#ffffff">
        <rect x="22" y="30" width="20" height="4" rx="1" />
        <rect x="16" y="22" width="6" height="20" rx="2" />
        <rect x="42" y="22" width="6" height="20" rx="2" />
        <rect x="10" y="26" width="6" height="12" rx="2" />
        <rect x="48" y="26" width="6" height="12" rx="2" />
      </g>
    </svg>
  )
}
