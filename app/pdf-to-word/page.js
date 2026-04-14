"use client"

import { useState } from "react"

export default function Page() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState("")
  const [status, setStatus] = useState("")

  const handleConvert = async () => {
    if (!file) return alert("Select file")

    setLoading(true)
    setStatus("Uploading...")

    // Step 1: Get upload URL
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/convert", {
      method: "POST",
      body: formData
    })

    const { uploadUrl, uploadParams, jobId } = await res.json()

    // Step 2: Upload file
    const uploadForm = new FormData()

    Object.keys(uploadParams).forEach((key) => {
      uploadForm.append(key, uploadParams[key])
    })

    uploadForm.append("file", file)

    await fetch(uploadUrl, {
      method: "POST",
      body: uploadForm
    })

    // Step 3: Poll status
    setStatus("Converting...")

    const interval = setInterval(async () => {
      const res = await fetch(`/api/status?jobId=${jobId}`)
      const data = await res.json()

      if (data.done) {
        clearInterval(interval)
        setLoading(false)
        setDownloadUrl(data.url)
        setStatus("Done ✅")
      }
    }, 2000)
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
        {loading ? status : "Convert"}
      </button>

      {downloadUrl && (
        <a href={downloadUrl} target="_blank">
          Download File 🔥
        </a>
      )}

    </main>
  )
}
