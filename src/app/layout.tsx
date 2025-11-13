import ScrollRestoration from "@/components/ScrollRestoration";
import "./globals.css";
import Navbar from "../components/Navbar/Navbar.server";
import { ModalProvider } from "@/contexts/ModalProvider"; // [신규] 1. ModalProvider 임포트

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ padding: 0, margin: 0 }}>
        <ModalProvider>
          <ScrollRestoration />
          <Navbar />
          <div className="container mx-auto pt-[56px]">{children}</div>
        </ModalProvider>
      </body>
    </html>
  );
}
