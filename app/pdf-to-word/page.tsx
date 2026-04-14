"use client"

import { useState } from "react"

export default function Page() {

  const [file, setFile] = useState<File | null>(null)

  const handleUpload = async () => {
    if (!file) return alert("Select file")

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/convert", {
      method: "POST",
      body: formData
    })

    const data = await res.json()
    console.log(data)

    alert("Check console for result 🔥")
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
        onChange={(e)=>setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} style={{
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
