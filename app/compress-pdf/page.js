"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import { supabase } from "@/lib/supabase"

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js"

export default function Page() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState("")

  const getMode = () => {
    if (!file) return
    if (file.size < 3 * 1024 * 1024) return "local" // 🔥 stricter
    return "server"
  }

  // =========================
  // ⚡ LOCAL (STRONGER)
  // =========================
  const handleLocal = async () => {
    const bytes = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise

    const newPdf = await PDFDocument.create()

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)

      // 🔥 LOWER SCALE
      const viewport = page.getViewport({ scale: 0.6 })

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({ canvasContext: ctx, viewport }).promise

      // 🔥 STRONG COMPRESSION
      const img = canvas.toDataURL("image/jpeg", 0.4)

      const jpg = await newPdf.embedJpg(img)

      const p = newPdf.addPage([jpg.width, jpg.height])

      p.drawImage(jpg, {
        x: 0,
        y: 0,
        width: jpg.width,
        height: jpg.height
      })

      setProgress(Math.round((i / pdf.numPages) * 100))
    }

    const pdfBytes = await newPdf.save()
    return new Blob([pdfBytes], { type: "application/pdf" })
  }

  // =========================
  // 🚀 SERVER (REAL)
  // =========================
  const handleServer = async () => {
    const res = await fetch("/api/compress?level=high", {
      method: "POST"
    })

    const { uploadUrl, uploadParams, jobId } = await res.json()

    const form = new FormData()
    Object.keys(uploadParams).forEach(k => {
      form.append(k, uploadParams[k])
    })
    form.append("file", file)

    await fetch(uploadUrl, { method: "POST", body: form })

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const res = await fetch(`/api/status?jobId=${jobId}`)
        const data = await res.json()

        if (data.error) {
          clearInterval(interval)
          reject("Compression failed")
        }

        if (data.done) {
          clearInterval(interval)
          resolve(data.url)
        }
      }, 2000)
    })
  }

  // =========================
  // 🔥 MAIN
  // =========================
  const handleCompress = async () => {
    if (!file) return alert("Select PDF")

    const { data } = await supabase.auth.getUser()
    if (!data?.user) {
      alert("Login required")
      window.location.href = "/login"
      return
    }

    const mode = getMode()

    setLoading(true)
    setProgress(0)
    setDownloadUrl("")

    try {
      if (mode === "local") {
        const blob = await handleLocal()
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
      } else {
        const url = await handleServer()
        setDownloadUrl(url)
      }

      setLoading(false)

      await supabase.from("files").insert([
        {
          user_id: data.user.id,
          name: file.name,
          type: "compress-pdf"
        }
      ])

    } catch (err) {
      console.error(err)
      alert("Compression failed ❌")
      setLoading(false)
    }
  }

  return (
    <main style={layout}>
      <h1>Compress PDF</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      {file && (
        <p style={{ color: "#22c55e" }}>
          Mode: {getMode() === "local" ? "Fast" : "Strong"}
        </p>
      )}

      {loading && (
        <div style={{ width: "80%" }}>
          <div style={barBg}>
            <div style={{ ...barFill, width: progress + "%" }} />
          </div>
          <p>{progress}%</p>
        </div>
      )}

      <button onClick={handleCompress} style={btn}>
        {loading ? "Processing..." : "Compress"}
      </button>

      {downloadUrl && (
        <a href={downloadUrl} target="_blank" style={link}>
          Download
        </a>
      )}
    </main>
  )
}

// UI
const layout = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  gap: "20px",
  background: "#020617",
  color: "#fff"
}

const btn = {
  padding: "12px 20px",
  background: "#22c55e",
  border: "none",
  borderRadius: "8px"
}

const link = {
  color: "#22c55e",
  fontWeight: "bold"
}

const barBg = {
  width: "100%",
  height: "10px",
  background: "#333",
  borderRadius: "10px"
}

const barFill = {
  height: "10px",
  background: "#22c55e"
}
