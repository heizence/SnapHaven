import ScrollRestoration from "@/components/ScrollRestoration";
import "./globals.css";
import Navbar from "../components/Navbar/Navbar.server";
import { ModalProvider } from "@/contexts/ModalProvider";
import { LoadingProvider } from "@/components/LoadingContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ padding: 0, margin: 0 }}>
        <LoadingProvider>
          <ModalProvider>
            <ScrollRestoration />
            <Navbar />
            <div className="container mx-auto pt-[56px]">{children}</div>
          </ModalProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
