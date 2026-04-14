export const metadata = {
  title: "FileLab",
  description: "All-in-One PDF & Image Tools",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico"
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={body}>
        {children}
      </body>
    </html>
  )
}

const body = {
  margin: 0,

  // 🔥 BETTER FONT STACK
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  background: "#020617",
  color: "#fff",

  // 🔥 SMOOTH TEXT
  WebkitFontSmoothing: "antialiased",

  // 🔥 FULL HEIGHT FIX
  minHeight: "100vh"
}
