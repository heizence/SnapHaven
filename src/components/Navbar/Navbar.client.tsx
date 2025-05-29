"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { signoutAPI } from "@/lib/APIs";

export default function Navbar({ authToken }: { authToken: string }) {
  const router = useRouter();
  const path = usePathname() || "";

  const [isMenuOpen, setIsMenuOpen] = useState(false); // for Hamburger menu bar
  const [isMypageMenuOpen, setIsMypageMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const signout = async () => {
    setIsMenuOpen(false);
    setIsMypageMenuOpen(false);
    try {
      const res = await signoutAPI();
      console.log("signout res : ", res);

      if (res.code === 200) {
        router.push("/signin");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const linkOnClick = () => {
    setIsMenuOpen(false);
    setIsMypageMenuOpen(false);
  };

  const MyProfileMenuComp = (isMobile: boolean) => {
    if (!authToken) return null;
    return (
      <div className="relative">
        <Button
          onMouseEnter={() => {
            setIsMypageMenuOpen(true);
          }}
          variant="ghost"
          size="icon"
        >
          <User size={60} />
          {isMypageMenuOpen && (
            <div
              className={`absolute ${
                isMobile ? "top-10 left-0" : "top-8 right-0"
              } mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50`}
            >
              <Link
                onClick={linkOnClick}
                href="/myprofile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                My Profile
              </Link>

              <Link
                onClick={linkOnClick}
                href="/customize"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                My Collection
              </Link>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              <span
                onClick={signout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Log out
              </span>
            </div>
          )}
        </Button>
      </div>
    );
  };

  const hiddenRoutes = ["/reset-password"];
  if (hiddenRoutes.includes(path)) return null;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/upload", label: "Upload" },
    { href: "/signin", label: "Signin", hide: Boolean(authToken) },
  ];

  return (
    <nav className="fixed w-full shadow-sm z-50 " style={{ backgroundColor: "#fff" }}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-primary">
          SnapHaven
        </Link>

        {/* Desktop Menu */}
        <div
          className="hidden md:flex space-x-6 items-center"
          onMouseLeave={() => setIsMypageMenuOpen(false)}
        >
          {navLinks.map((link) => {
            if (link.hide) return;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            );
          })}
          {MyProfileMenuComp(false)}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg">
              <div
                className="container mx-auto px-4 py-4 space-y-4"
                onMouseLeave={() => setIsMypageMenuOpen(false)}
              >
                {navLinks.map((link) => {
                  if (link.hide) return;
                  return (
                    <Link
                      onMouseEnter={() => setIsMypageMenuOpen(false)}
                      key={link.href}
                      href={link.href}
                      className="block text-foreground hover:text-primary py-2"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {MyProfileMenuComp(true)}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
