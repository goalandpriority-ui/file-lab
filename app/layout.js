export const metadata = {
  title: "FileLab",
  description: "All-in-One PDF & Image Tools"
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: "Arial",
        background: "#020617",
        color: "#fff"
      }}>
        {children}
      </body>
    </html>
  )
}
