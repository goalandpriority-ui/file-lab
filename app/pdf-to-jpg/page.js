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
    setDownloadUrl("")
    setStatus("Preparing...")

    try {
      const res = await fetch("/api/convert?type=pdf-to-jpg", {
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

    } catch (err) {
      setLoading(false)
      setStatus("Error ❌")
      alert("Something went wrong")
    }
  }

  return (
    <main style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:"20px"}}>
      <h1>PDF → JPG</h1>

      <input type="file" onChange={(e)=>setFile(e.target.files[0])} />

      <button onClick={handleConvert}>
        {loading ? status : "Convert"}
      </button>

      {downloadUrl && <a href={downloadUrl}>Download 🔥</a>}
    </main>
  )
        }
