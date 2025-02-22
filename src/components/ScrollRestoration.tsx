"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = `scrollPosition-${pathname}${searchParams}`;
    const savedPosition = sessionStorage.getItem(key);

    if (savedPosition !== null) {
      window.scrollTo(0, parseInt(savedPosition, 10));
    }

    const handleScroll = () => {
      sessionStorage.setItem(key, window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, searchParams]);

  return null;
}
