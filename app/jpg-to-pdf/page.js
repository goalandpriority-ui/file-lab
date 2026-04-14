"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Page() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState("")
  const [status, setStatus] = useState("")

  const handleConvert = async () => {
    if (!file) return alert("Select image")

    // 🔥 LOGIN CHECK
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      alert("Login required 🔐")
      window.location.href = "/login"
      return
    }

    setLoading(true)
    setDownloadUrl("")
    setStatus("Preparing...")

    try {
      const res = await fetch("/api/convert?type=jpg-to-pdf", {
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

          // 🔥 SAVE TO DATABASE
          await supabase.from("files").insert([
            {
              user_id: userData.user.id,
              name: file.name,
              type: "jpg-to-pdf",
              file_url: data.url
            }
          ])
        }
      }, 2000)

    } catch (err) {
      console.error(err)
      setLoading(false)
      setStatus("Error ❌")
      alert("Something went wrong")
    }
  }

  return (
    <main style={layout}>

      <h1>JPG → PDF</h1>

      <input 
        type="file" 
        accept="image/*"
        onChange={(e)=>setFile(e.target.files[0])} 
      />

      <button 
        onClick={handleConvert}
        disabled={loading}
        style={btn}
      >
        {loading ? status : "Convert"}
      </button>

      {downloadUrl && (
        <a href={downloadUrl} target="_blank" style={link}>
          Download PDF 🔥
        </a>
      )}

    </main>
  )
}

// 🔥 STYLES

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

const btn = {
  padding:"12px 20px",
  background:"#22c55e",
  border:"none",
  borderRadius:"8px",
  color:"#000",
  fontWeight:"bold"
}

const link = {
  color:"#22c55e",
  fontWeight:"bold"
}
