"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, Moon, Sun, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { signoutAPI } from "@/lib/APIs";

export default function Navbar({ authToken }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // for Hamburger menu bar
  const [isMypageMenuOpen, setIsMypageMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMypageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const signout = async () => {
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

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/upload", label: "Upload" },
    { href: "/signin", label: "Signin", hide: authToken !== null },
  ];

  return (
    <nav className="fixed w-full shadow-sm z-50 " style={{ backgroundColor: "#fff" }}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-primary">
          Snap Haven
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center">
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

          {authToken && (
            <div className="relative" ref={dropdownRef}>
              <Button variant="ghost" size="icon" onClick={() => setIsMypageMenuOpen((o) => !o)}>
                <User size={60} />
                {isMypageMenuOpen && (
                  <div className="absolute top-8 right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                    <Link
                      href="/tasks"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      My Account
                    </Link>

                    <Link
                      href="/customize"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      My Collection
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                    <button
                      onClick={signout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle Menu">
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {/* <Button variant="ghost" size="icon" onClick={signout} aria-label="Toggle Theme">
          logout
        </Button> */}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navLinks.map((link) => {
              if (link.hide) return;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-foreground hover:text-primary py-2"
                  onClick={toggleMenu}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Theme Toggle */}
            <Button variant="outline" className="w-full" onClick={toggleTheme}>
              {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              {theme === "dark" ? <Sun className="ml-2" /> : <Moon className="ml-2" />}
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
