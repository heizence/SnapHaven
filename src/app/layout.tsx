/**
 * layout.tsx defines the layout structure shared across all pages in the app
 * It wraps the content of every page using the children prop, enabling consistent headers, footers, or styling across the app.
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The <html> tag sets the language attribute (lang="en" in this example), which is important for accessibility and SEO.
  return (
    <html lang="en">
      {/* The children prop is a special React feature. It represents the components rendered within this layout. */}
      
      <body style={{padding:0, margin:0}}>
      <header style={{ background: "#333", color: "#fff", padding: "1rem" }}>
          <h1>My Website</h1>
        </header>
      {children}
      <footer style={{ background: "#333", color: "#fff", padding: "1rem", marginTop: "2rem" }}>
    <p>© 2025 My Website</p>
  </footer>
      </body>
    </html>
  )
}