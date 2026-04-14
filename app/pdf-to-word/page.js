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
      // 🔥 STEP 1: Create job (NO FILE SEND)
      const res = await fetch("/api/convert", {
        method: "POST"
      })

      // ✅ ERROR CHECK ADD
      if (!res.ok) {
        const errData = await res.json()
        alert("API ERROR: " + JSON.stringify(errData))
        setLoading(false)
        setStatus("Error ❌")
        return
      }

      const data = await res.json()

      // ✅ SAFE CHECK
      if (!data.uploadUrl || !data.uploadParams || !data.jobId) {
        alert("Invalid API response: " + JSON.stringify(data))
        setLoading(false)
        setStatus("Error ❌")
        return
      }

      const { uploadUrl, uploadParams, jobId } = data

      // 🔥 STEP 2: Upload file directly
      setStatus("Uploading...")

      const uploadForm = new FormData()

      Object.keys(uploadParams).forEach((key) => {
        uploadForm.append(key, uploadParams[key])
      })

      uploadForm.append("file", file)

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: uploadForm
      })

      // ✅ UPLOAD ERROR CHECK
      if (!uploadRes.ok) {
        alert("Upload failed ❌")
        setLoading(false)
        setStatus("Error ❌")
        return
      }

      // 🔥 STEP 3: Poll status
      setStatus("Converting...")

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/status?jobId=${jobId}`)
          const data = await res.json()

          if (data.done) {
            clearInterval(interval)
            setLoading(false)
            setDownloadUrl(data.url)
            setStatus("Done ✅")
          }

          // ✅ IF ERROR RETURNED
          if (data.error) {
            clearInterval(interval)
            alert("Status Error: " + JSON.stringify(data))
            setLoading(false)
            setStatus("Error ❌")
          }

        } catch (err) {
          clearInterval(interval)
          alert("Polling failed ❌")
          setLoading(false)
          setStatus("Error ❌")
        }
      }, 2000)

    } catch (err) {
      console.error(err)
      setLoading(false)
      setStatus("Error ❌")
      alert("Something went wrong: " + err.message)
    }
  }

  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: "20px",
      background: "#020617",
      color: "#fff"
    }}>

      <h1>PDF to Word</h1>

      <input 
        type="file"
        onChange={(e)=>setFile(e.target.files[0])}
      />

      <button 
        onClick={handleConvert}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: loading ? "#555" : "#22c55e",
          border: "none",
          borderRadius: "8px",
          color: "#000",
          fontWeight: "bold"
        }}
      >
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
