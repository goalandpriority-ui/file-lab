"use client"

import { useState } from "react"

export default function Page() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState("")
  const [status, setStatus] = useState("")

  const handleConvert = async () => {
    if (files.length < 2) return alert("Select at least 2 PDFs")

    setLoading(true)
    setDownloadUrl("")
    setStatus("Preparing...")

    try {
      // 🔥 Create job
      const res = await fetch("/api/merge", {
        method: "POST"
      })

      const { uploadUrl, uploadParams, jobId } = await res.json()

      setStatus("Uploading files...")

      // 🔥 Upload all files
      for (let file of files) {
        const uploadForm = new FormData()

        Object.keys(uploadParams).forEach((key) => {
          uploadForm.append(key, uploadParams[key])
        })

        uploadForm.append("file", file)

        await fetch(uploadUrl, {
          method: "POST",
          body: uploadForm
        })
      }

      setStatus("Merging PDFs...")

      // 🔥 Poll status
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

    } catch (err) {
      setLoading(false)
      setStatus("Error ❌")
      alert("Merge failed")
    }
  }

  return (
    <main style={{
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      height:"100vh",
      gap:"20px",
      background:"#020617",
      color:"#fff"
    }}>

      <h1>Merge PDF</h1>

      <input 
        type="file"
        multiple
        accept="application/pdf"
        onChange={(e)=>setFiles([...e.target.files])}
      />

      <button 
        onClick={handleConvert}
        disabled={loading}
        style={{
          padding:"10px 20px",
          background: loading ? "#555" : "#22c55e",
          border:"none",
          borderRadius:"8px",
          color:"#000"
        }}
      >
        {loading ? status : "Merge"}
      </button>

      {downloadUrl && (
        <a href={downloadUrl} target="_blank">
          Download Merged PDF 🔥
        </a>
      )}

    </main>
  )
    }
