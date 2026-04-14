export default function Home() {
  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: "20px"
    }}>

      <h1 style={{fontSize: "32px"}}>
        FileLab 🚀
      </h1>

      <p>
        All-in-One PDF & Image Tools
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px"
      }}>

        <a href="/pdf-to-word" style={btn}>PDF → Word</a>
        <a href="/word-to-pdf" style={btn}>Word → PDF</a>
        <a href="/compress-pdf" style={btn}>Compress PDF</a>
        <a href="/image-compress" style={btn}>Image Compress</a>

      </div>

    </main>
  )
}

const btn = {
  padding: "12px",
  background: "#22c55e",
  color: "#000",
  textAlign: "center", // ✅ FIXED
  borderRadius: "8px",
  textDecoration: "none"
}
