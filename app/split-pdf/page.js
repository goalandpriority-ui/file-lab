"use client"

import { useState } from "react"

export default function Page() {
  const [file, setFile] = useState(null)
  const [pages, setPages] = useState("1-2")
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState("")
  const [status, setStatus] = useState("")

  const handleSplit = async () => {
    if (!file) return alert("Select PDF")

    setLoading(true)
    setDownloadUrl("")
    setStatus("Preparing...")

    try {
      // 🔥 Create job
      const res = await fetch(`/api/split?pages=${pages}`, {
        method: "POST"
      })

      const { uploadUrl, uploadParams, jobId } = await res.json()

      setStatus("Uploading...")

      const uploadForm = new FormData()
      Object.keys(uploadParams).forEach((key) => {
        uploadForm.append(key, uploadParams[key])
      })

      uploadForm.append("file", file)

      await fetch(uploadUrl, {
        method: "POST",
        body: uploadForm
      })

      setStatus("Splitting...")

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
      alert("Split failed")
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

      <h1>Split PDF</h1>

      <input 
        type="file"
        accept="application/pdf"
        onChange={(e)=>setFile(e.target.files[0])}
      />

      <input 
        placeholder="Enter pages (e.g. 1-2 or 3-5)"
        value={pages}
        onChange={(e)=>setPages(e.target.value)}
        style={{padding:"10px", borderRadius:"8px"}}
      />

      <button 
        onClick={handleSplit}
        disabled={loading}
        style={{
          padding:"10px 20px",
          background: loading ? "#555" : "#22c55e",
          border:"none",
          borderRadius:"8px",
          color:"#000"
        }}
      >
        {loading ? status : "Split"}
      </button>

      {downloadUrl && (
        <a href={downloadUrl} target="_blank">
          Download Split PDF 🔥
        </a>
      )}

    </main>
  )
          }
