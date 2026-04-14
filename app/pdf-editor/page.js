"use client"

import { useState } from "react"

export default function Page() {
  const [fileUrl, setFileUrl] = useState(null)

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setFileUrl(url)
    }
  }

  return (
    <main style={{
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      padding:"20px",
      background:"#020617",
      color:"#fff",
      minHeight:"100vh",
      gap:"20px"
    }}>

      <h1>PDF Editor</h1>

      <input type="file" accept="application/pdf" onChange={handleUpload} />

      {fileUrl && (
        <iframe 
          src={fileUrl}
          width="100%"
          height="500px"
          style={{border:"none"}}
        />
      )}

      <p>👉 Next: text add + annotation (coming 🔥)</p>

    </main>
  )
}
