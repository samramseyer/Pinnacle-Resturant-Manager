import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  priority?: boolean;
  /** White wordmark for dark headers (uses logo-nav.svg) */
  variant?: "default" | "on-dark";
}

export function Logo({ className, href, priority = false, variant = "default" }: LogoProps) {
  const isOnDark = variant === "on-dark";
  const image = (
    <Image
      src={isOnDark ? "/logo-nav.svg" : "/logo.png"}
      alt="Pinnacle Restaurant Manager"
      width={isOnDark ? 200 : 220}
      height={isOnDark ? 40 : 44}
      priority={priority}
      className={cn(
        "w-auto max-w-full object-contain object-left",
        isOnDark ? "h-8 sm:h-9" : "h-11 rounded-md object-contain object-left",
        className
      )}
    />
  );

  if (href !== undefined) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {image}
      </Link>
    );
  }

  return image;
}
