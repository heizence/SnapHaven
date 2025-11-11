import ScrollRestoration from "@/components/ScrollRestoration";
import "./globals.css";
import Navbar from "../components/Navbar/Navbar.server";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ padding: 0, margin: 0 }}>
        <ScrollRestoration />
        <Navbar />
        <div className="container mx-auto pt-[56px]">{children}</div>
      </body>
    </html>
  );
}
