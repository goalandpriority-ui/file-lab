export default function Page() {
  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: "20px"
    }}>

      <h1>PDF to Word</h1>

      <input type="file" />

      <button style={{
        padding: "10px 20px",
        background: "#22c55e",
        border: "none",
        borderRadius: "8px"
      }}>
        Convert
      </button>

    </main>
  )
}
