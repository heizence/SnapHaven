"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User, Search, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signoutAPI } from "@/lib/APIs";
import CustomLocalStorage from "@/lib/CustomLocalStorage";
import Image from "next/image";
import { AWS_BASE_URL } from "@/constants";

export default function Navbar({ isSignedIn }: { isSignedIn: boolean }) {
  const router = useRouter();
  const path = usePathname() || "";
  const searchParams = useSearchParams();

  const [isClient, setIsClient] = useState(false); // 컴포넌트가 브라우저에 마운트된 상태 여부. hydration 에러 방지용
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMypageMenuOpen, setIsMypageMenuOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState(searchParams?.get("keyword") || "");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 컴포넌트가 브라우저에 마운트된 후 isClient를 true로 설정
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 바깥쪽 클릭 처리
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if ((e.target as HTMLElement).closest('[aria-label="Toggle Menu"]')) {
          return;
        }
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //  URL 쿼리 -> 검색창 동기화(예: 브라우저 뒤로가기/앞으로가기 버튼 클릭 시)
  useEffect(() => {
    setSearchTerm(searchParams?.get("keyword") || "");
  }, [searchParams]);

  // 모바일 메뉴 닫힐 때 검색어 초기화
  useEffect(() => {
    if (!isMenuOpen) {
      setSearchTerm(searchParams?.get("keyword") || "");
    }
  }, [isMenuOpen, searchParams]);

  // 검색 실행 공통 로직
  const executeSearch = (term: string) => {
    if (!term.trim()) return;

    // 포커스 해제 (키보드 닫기)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    router.push(`/search?keyword=${term.trim()}`);
    setIsMenuOpen(false);
  };

  // 엔터 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch(searchTerm);
    }
  };

  // 돋보기 클릭 핸들러
  const handleSearchClick = () => {
    executeSearch(searchTerm);
  };

  // 검색 키워드 지우기
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const signout = async () => {
    setIsMenuOpen(false);
    setIsMypageMenuOpen(false);
    try {
      const res = await signoutAPI();
      if (res.code === 200) {
        CustomLocalStorage.clearUserInfo();
        router.push("/signin");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 각 메뉴 클릭
  const linkOnClick = () => {
    setIsMenuOpen(false);
    setIsMypageMenuOpen(false);
  };

  const MyProfileMenuComp = (isMobile: boolean) => {
    if (!isSignedIn) return null;
    const userState = isClient ? CustomLocalStorage.getUserInfo() : null;
    return (
      <div
        className="relative p-1"
        onMouseEnter={() => !isMobile && setIsMypageMenuOpen(true)}
        onMouseLeave={() => !isMobile && setIsMypageMenuOpen(false)}
      >
        <button
          onClick={() => isMobile && setIsMypageMenuOpen(!isMypageMenuOpen)}
          className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
        >
          {isClient && userState?.profileImageKey ? (
            <Image
              src={AWS_BASE_URL + userState?.profileImageKey}
              alt="preview"
              width={0} // width 및 height 속성은 필수값이라서 형식적으로 넣어둠
              height={0}
              priority={true}
              className="w-11 h-11 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <User size={20} className="text-gray-500" />
          )}
        </button>

        {isMypageMenuOpen && (
          <div
            className={`absolute ${
              isMobile ? "top-10 left-0" : "top-10 right-0"
            } mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50`}
          >
            <Link
              onClick={linkOnClick}
              href="/mypage"
              className="flex items-center px-4 py-2 text-lm text-gray-700 hover:bg-gray-100"
            >
              내 프로필
            </Link>
            <Link
              onClick={linkOnClick}
              href="/mypage/collections"
              className="flex items-center px-4 py-2 text-lm text-gray-700 hover:bg-gray-100"
            >
              내 컬렉션
            </Link>
            <div className="border-t border-gray-200 my-1" />
            <span
              onClick={signout}
              className="flex items-center w-full text-left px-4 py-2 text-lm text-red-600 hover:bg-gray-100 cursor-pointer"
            >
              로그아웃
            </span>
          </div>
        )}
      </div>
    );
  };

  const hiddenRoutes = ["/reset-password"];
  if (hiddenRoutes.includes(path)) return null;

  return (
    <nav className="fixed w-full shadow-sm z-50 " style={{ backgroundColor: "#fff" }}>
      <div className="container mx-auto px-4 py-3 grid grid-cols-3 items-center">
        <div className="justify-self-start">
          <div
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            className="text-2xl font-bold text-gray-800 cursor-pointer"
          >
            SnapHaven
          </div>
        </div>

        <div className="hidden md:flex justify-self-center w-full max-w-lg">
          <div className="relative w-full">
            <input
              type="search"
              placeholder="사진 또는 영상 검색"
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-search-cancel-button]:appearance-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSearchClick}>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                size={20}
              />
            </button>

            {/* X 버튼: 검색어가 있을 때만 표시 */}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex justify-self-end items-center space-x-3">
          {isSignedIn ? (
            <>
              {/* 로그인 상태 */}
              <Link
                href="/upload"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                <LayoutGrid size={16} />
                업로드
              </Link>
              {MyProfileMenuComp(false)}
            </>
          ) : (
            <>
              {/* 로그아웃 상태 */}
              <Link
                href="/signin"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-700"
              >
                회원가입
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <div className="md:hidden justify-self-end col-start-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile menu Dropdown */}
      {isMenuOpen && (
        <div
          ref={dropdownRef}
          className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            <div className="relative w-full">
              <input
                type="search"
                placeholder="검색..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-100 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown} // 검색 기능
              />
              <button onClick={handleSearchClick}>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </button>
            </div>

            {isSignedIn ? (
              <>
                <Link
                  href="/upload"
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                  onClick={linkOnClick}
                >
                  <LayoutGrid size={16} />
                  업로드
                </Link>
                <div onMouseLeave={() => setIsMypageMenuOpen(false)}>{MyProfileMenuComp(true)}</div>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="block text-gray-700 hover:text-blue-600 py-2"
                  onClick={linkOnClick}
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="block text-gray-700 hover:text-blue-600 py-2"
                  onClick={linkOnClick}
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
