"use client"

import { useState } from "react"

export default function Page() {

  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState("")

  const handleConvert = async () => {
    if (!file) return alert("Select file")

    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/convert", {
      method: "POST",
      body: formData
    })

    const data = await res.json()

    setLoading(false)

    if (data.url) {
      setDownloadUrl(data.url)
    } else {
      alert("Conversion failed ❌")
    }
  }

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

      <input 
        type="file" 
        onChange={(e)=>setFile(e.target.files[0])}
      />

      <button onClick={handleConvert} style={{
        padding: "10px 20px",
        background: "#22c55e",
        border: "none",
        borderRadius: "8px"
      }}>
        {loading ? "Converting..." : "Convert"}
      </button>

      {downloadUrl && (
        <a href={downloadUrl} target="_blank">
          Download File 🔥
        </a>
      )}

    </main>
  )
}
