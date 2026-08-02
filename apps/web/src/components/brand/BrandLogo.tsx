import Image from 'next/image';
import Link from 'next/link';

const SIZES = {
  sm: { height: 28, width: 78 },
  md: { height: 36, width: 100 },
  lg: { height: 48, width: 133 },
  xl: { height: 64, width: 177 },
} as const;

type BrandLogoProps = {
  href?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  priority?: boolean;
  /** Use square mark instead of full wordmark (e.g. compact dark nav). */
  mark?: boolean;
};

export function BrandLogo({
  href = '/',
  size = 'md',
  className = '',
  priority = false,
  mark = false,
}: BrandLogoProps) {
  const dims = mark
    ? { height: SIZES[size].height, width: SIZES[size].height }
    : SIZES[size];

  const image = (
    <Image
      src={mark ? '/brand/icon.png' : '/brand/logo.png'}
      alt="eFundo"
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={`w-auto object-contain object-left ${className}`}
      style={{ height: dims.height, width: 'auto' }}
    />
  );

  if (href == null) return image;

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-efundo-accent"
      aria-label="eFundo home"
    >
      {image}
    </Link>
  );
}
