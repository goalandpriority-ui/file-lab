"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Page() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState("")
  const [status, setStatus] = useState("")
  const [level, setLevel] = useState("medium") // 🔥 NEW
  const [beforeSize, setBeforeSize] = useState(null) // 🔥 NEW
  const [afterSize, setAfterSize] = useState(null) // 🔥 NEW

  // 🔥 FORMAT SIZE
  const formatSize = (bytes) => {
    if (!bytes) return ""
    const mb = bytes / (1024 * 1024)
    return mb.toFixed(2) + " MB"
  }

  const handleConvert = async () => {
    if (!file) return alert("Select PDF")

    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      alert("Login required 🔐")
      window.location.href = "/login"
      return
    }

    setLoading(true)
    setStatus("Preparing...")
    setDownloadUrl("")
    setAfterSize(null)

    // 🔥 SAVE ORIGINAL SIZE
    setBeforeSize(file.size)

    try {
      // 🔥 SEND LEVEL TO API
      const res = await fetch(`/api/convert?type=compress-pdf&level=${level}`, {
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

          // 🔥 FETCH COMPRESSED FILE SIZE
          try {
            const head = await fetch(data.url, { method: "HEAD" })
            const size = head.headers.get("content-length")
            if (size) setAfterSize(Number(size))
          } catch {}

          await supabase.from("files").insert([
            {
              user_id: userData.user.id,
              name: file.name,
              type: "compress-pdf"
            }
          ])
        }
      }, 2000)

    } catch (err) {
      console.error(err)
      setLoading(false)
      alert("Error ❌")
    }
  }

  return (
    <main style={layout}>
      <h1>Compress PDF 🔥</h1>

      <input 
        type="file" 
        accept="application/pdf"
        onChange={(e)=>{
          const f = e.target.files[0]
          setFile(f)
          if (f) setBeforeSize(f.size)
        }}
      />

      {/* 🔥 COMPRESSION LEVEL */}
      <select 
        value={level} 
        onChange={(e)=>setLevel(e.target.value)}
        style={select}
      >
        <option value="low">Low Compression (High Quality)</option>
        <option value="medium">Medium (Balanced)</option>
        <option value="high">High Compression (Small Size)</option>
      </select>

      {/* 🔥 SIZE DISPLAY */}
      {beforeSize && (
        <p>Before: {formatSize(beforeSize)}</p>
      )}

      {afterSize && (
        <p style={{ color:"#22c55e" }}>
          After: {formatSize(afterSize)} 🚀
        </p>
      )}

      <button 
        onClick={handleConvert}
        disabled={loading}
        style={btn}
      >
        {loading ? status : "Compress"}
      </button>

      {downloadUrl && (
        <a href={downloadUrl} target="_blank" style={link}>
          Download 🔥
        </a>
      )}

    </main>
  )
}

// 🎨 STYLES

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
  fontWeight:"bold"
}

const link = {
  color:"#22c55e",
  fontWeight:"bold"
}

const select = {
  padding:"10px",
  borderRadius:"8px"
    }
