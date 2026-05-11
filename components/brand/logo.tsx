import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "mark";
  size?: number;
}

/**
 * Logo Pancho Bus recreado. "Pancho" en rojo, "bus" con la "o" como pin
 * de ubicación rellenado con naranja (referencia al logo original PNG).
 */
export function Logo({ className, variant = "full", size = 32 }: LogoProps) {
  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 40 48"
        width={size}
        height={size * 1.2}
        className={cn("inline-block", className)}
        aria-label="Pancho Bus"
      >
        <defs>
          <linearGradient id="pin-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F39200" />
            <stop offset="100%" stopColor="#E11B22" />
          </linearGradient>
        </defs>
        <path
          d="M20 2 C9.5 2 1 10.5 1 21 C1 33.5 20 46 20 46 C20 46 39 33.5 39 21 C39 10.5 30.5 2 20 2 Z"
          fill="url(#pin-grad)"
        />
        {/* Bus icon dentro del pin */}
        <g transform="translate(8.5, 11)" fill="white">
          <rect x="0" y="0" width="23" height="15" rx="3" />
          <rect x="2" y="3" width="8" height="5" rx="1" fill="#E11B22" />
          <rect x="13" y="3" width="8" height="5" rx="1" fill="#E11B22" />
          <circle cx="5" cy="16" r="2.2" fill="#231F20" />
          <circle cx="18" cy="16" r="2.2" fill="#231F20" />
        </g>
      </svg>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 40 48"
        width={size}
        height={size * 1.2}
        aria-hidden
      >
        <defs>
          <linearGradient id={`pin-grad-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F39200" />
            <stop offset="100%" stopColor="#E11B22" />
          </linearGradient>
        </defs>
        <path
          d="M20 2 C9.5 2 1 10.5 1 21 C1 33.5 20 46 20 46 C20 46 39 33.5 39 21 C39 10.5 30.5 2 20 2 Z"
          fill={`url(#pin-grad-${size})`}
        />
        <g transform="translate(8.5, 11)" fill="white">
          <rect x="0" y="0" width="23" height="15" rx="3" />
          <rect x="2" y="3" width="8" height="5" rx="1" fill="#E11B22" />
          <rect x="13" y="3" width="8" height="5" rx="1" fill="#E11B22" />
          <circle cx="5" cy="16" r="2.2" fill="#231F20" />
          <circle cx="18" cy="16" r="2.2" fill="#231F20" />
        </g>
      </svg>
      <span
        className="font-display font-bold tracking-tight"
        style={{ fontSize: size * 0.85 }}
      >
        <span style={{ color: "#E11B22" }}>Pancho</span>
        <span style={{ color: "#F39200" }}>bus</span>
      </span>
    </div>
  );
}
