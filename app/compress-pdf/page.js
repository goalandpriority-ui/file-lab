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
  const [level, setLevel] = useState("medium")

  // 🔥 QUALITY SETTINGS
  const getQuality = () => {
    if (level === "low") return 1.0       // high quality
    if (level === "medium") return 0.7    // balanced
    if (level === "high") return 0.4      // strong compress
  }

  const handleCompress = async () => {
    if (!file) return alert("Select PDF 😤")

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      alert("Login required 🔐")
      window.location.href = "/login"
      return
    }

    setLoading(true)
    setProgress(0)
    setDownloadUrl("")

    try {
      const bytes = await file.arrayBuffer()

      // 🔥 LOAD PDF VIA PDF.JS
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise

      const newPdf = await PDFDocument.create()
      const quality = getQuality()

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)

        const viewport = page.getViewport({ scale: 1.5 })

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: context,
          viewport
        }).promise

        // 🔥 IMAGE COMPRESSION
        const imgData = canvas.toDataURL("image/jpeg", quality)

        const jpgImage = await newPdf.embedJpg(imgData)

        const pageNew = newPdf.addPage([
          jpgImage.width,
          jpgImage.height
        ])

        pageNew.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: jpgImage.width,
          height: jpgImage.height
        })

        // 🔥 PROGRESS
        setProgress(Math.round((i / pdf.numPages) * 100))
      }

      const pdfBytes = await newPdf.save()

      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      setDownloadUrl(url)
      setLoading(false)

      await supabase.from("files").insert([
        {
          user_id: userData.user.id,
          name: file.name,
          type: "compress-pdf"
        }
      ])

    } catch (err) {
      console.error(err)
      alert("Error ❌")
      setLoading(false)
    }
  }

  return (
    <main style={layout}>
      <h1>Strong Compress PDF 🔥</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <select
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        style={select}
      >
        <option value="low">Low (High Quality)</option>
        <option value="medium">Medium (Balanced)</option>
        <option value="high">High (Small Size 🔥)</option>
      </select>

      {/* 🔥 PROGRESS */}
      {loading && (
        <div style={{ width: "80%" }}>
          <div style={barBg}>
            <div style={{ ...barFill, width: progress + "%" }} />
          </div>
          <p>{progress}%</p>
        </div>
      )}

      <button onClick={handleCompress} style={btn}>
        {loading ? "Compressing..." : "Strong Compress 🔥"}
      </button>

      {downloadUrl && (
        <a href={downloadUrl} download="compressed.pdf" style={link}>
          Download 🔥
        </a>
      )}
    </main>
  )
}

// 🎨 STYLES

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
  borderRadius: "8px",
  fontWeight: "bold"
}

const link = {
  color: "#22c55e",
  fontWeight: "bold"
}

const select = {
  padding: "10px",
  borderRadius: "8px"
}

const barBg = {
  width: "100%",
  height: "10px",
  background: "#333",
  borderRadius: "10px"
}

const barFill = {
  height: "10px",
  background: "#22c55e",
  borderRadius: "10px"
        }
