import Link from "next/link";

// The Pinged "ping" logomark: a dot emitting concentric signal arcs.
export function Logomark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="21" r="4" fill="currentColor" />
      <path
        d="M17 21a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M22 21a11 11 0 0 0-11-11"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.42"
      />
      <path
        d="M27 21A16 16 0 0 0 11 5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}

export function Wordmark({
  href = "/",
  size = 24,
}: {
  href?: string;
  size?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
    >
      <Logomark size={size} />
      <span style={{ fontSize: size * 0.7 }}>Pinged</span>
    </Link>
  );
}

// Initials avatar derived from a name. Rounded by default; `square` rounds the
// corners instead (used for source/file tiles).
export function Monogram({
  name,
  size = 36,
  square = false,
}: {
  name: string;
  size?: number;
  square?: boolean;
}) {
  const initials =
    (name || "?")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center bg-primary font-semibold tracking-tight text-primary-foreground"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        borderRadius: square ? size * 0.28 : "9999px",
      }}
    >
      {initials}
    </span>
  );
}
