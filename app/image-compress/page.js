"use client"

import { useState } from "react"

export default function Page() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState("")
  const [status, setStatus] = useState("")

  const handleConvert = async () => {
    if (!file) return alert("Select image")

    setLoading(true)
    setStatus("Preparing...")
    setDownloadUrl("")

    try {
      const res = await fetch("/api/convert?type=image-compress", {
        method: "POST"
      })

      const { uploadUrl, uploadParams, jobId } = await res.json()

      setStatus("Uploading...")

      const form = new FormData()
      Object.keys(uploadParams).forEach((k) => {
        form.append(k, uploadParams[k])
      })
      form.append("file", file)

      await fetch(uploadUrl, { method: "POST", body: form })

      setStatus("Compressing...")

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

    } catch {
      setLoading(false)
      alert("Error ❌")
    }
  }

  return (
    <main style={layout}>
      <h1>Image Compress</h1>
      <input type="file" onChange={(e)=>setFile(e.target.files[0])}/>
      <button onClick={handleConvert}>
        {loading ? status : "Compress"}
      </button>
      {downloadUrl && <a href={downloadUrl}>Download 🔥</a>}
    </main>
  )
}

const layout = {
  display:"flex",
  flexDirection:"column",
  alignItems:"center",
  justifyContent:"center",
  height:"100vh",
  gap:"20px",
  background:"#020617",
  color:"#fff"
}
