/**
 * layout.tsx defines the layout structure shared across all pages in the app
 * It wraps the content of every page using the children prop, enabling consistent headers, footers, or styling across the app.
 */
import ScrollRestoration from "@/components/ScrollRestoration";
import "./globals.css";
import Navbar from "../components/Navbar/Navbar.server";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The <html> tag sets the language attribute (lang="en" in this example), which is important for accessibility and SEO.
  return (
    <html lang="en">
      {/* The children prop is a special React feature. It represents the components rendered within this layout. */}

      <body style={{ padding: 0, margin: 0 }}>
        <ScrollRestoration />
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-16">{children}</div>
      </body>
    </html>
  );
}
