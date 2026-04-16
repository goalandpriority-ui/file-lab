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
  const [beforeSize, setBeforeSize] = useState(null)
  const [afterSize, setAfterSize] = useState(null)

  const formatSize = (bytes) => {
    if (!bytes) return ""
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const getQuality = () => {
    if (level === "low") return 1.0
    if (level === "medium") return 0.7
    if (level === "high") return 0.4
  }

  const handleFile = (f) => {
    setFile(f)
    setBeforeSize(f.size)
    setAfterSize(null)
    setDownloadUrl("")
  }

  const handleCompress = async () => {
    if (!file) return alert("Select PDF")

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      alert("Login required")
      window.location.href = "/login"
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      const bytes = await file.arrayBuffer()
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

        await page.render({ canvasContext: context, viewport }).promise

        const imgData = canvas.toDataURL("image/jpeg", quality)
        const jpgImage = await newPdf.embedJpg(imgData)

        const pageNew = newPdf.addPage([jpgImage.width, jpgImage.height])

        pageNew.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: jpgImage.width,
          height: jpgImage.height
        })

        setProgress(Math.round((i / pdf.numPages) * 100))
      }

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })

      setAfterSize(blob.size)

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
      alert("Error")
      setLoading(false)
    }
  }

  return (
    <main style={layout}>
      <div style={card}>
        <h1 style={{ marginBottom: "10px" }}>Compress PDF</h1>

        {/* 🔥 DRAG DROP */}
        <div
          style={drop}
          onDrop={(e) => {
            e.preventDefault()
            handleFile(e.dataTransfer.files[0])
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {file ? file.name : "Drag & Drop PDF or Click"}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: "none" }}
            id="fileInput"
          />
        </div>

        <label htmlFor="fileInput" style={uploadBtn}>
          Choose File
        </label>

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          style={select}
        >
          <option value="low">Low (High Quality)</option>
          <option value="medium">Medium</option>
          <option value="high">High (Small Size)</option>
        </select>

        {/* 🔥 SIZE DISPLAY */}
        {beforeSize && (
          <p>Before: {formatSize(beforeSize)}</p>
        )}

        {afterSize && (
          <p style={{ color: "#22c55e" }}>
            After: {formatSize(afterSize)}
          </p>
        )}

        {/* 🔥 PROGRESS */}
        {loading && (
          <div style={{ width: "100%" }}>
            <div style={barBg}>
              <div style={{ ...barFill, width: progress + "%" }} />
            </div>
            <p>{progress}%</p>
          </div>
        )}

        <button onClick={handleCompress} style={btn}>
          {loading ? "Compressing..." : "Compress"}
        </button>

        {downloadUrl && (
          <a href={downloadUrl} download="compressed.pdf" style={link}>
            Download
          </a>
        )}
      </div>
    </main>
  )
}

// 🎨 GLASS UI STYLES

const layout = {
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#020617,#0f172a)",
  color: "#fff"
}

const card = {
  backdropFilter: "blur(12px)",
  background: "rgba(255,255,255,0.05)",
  padding: "30px",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "400px",
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  alignItems: "center"
}

const drop = {
  border: "2px dashed #444",
  padding: "20px",
  width: "100%",
  textAlign: "center",
  borderRadius: "10px",
  cursor: "pointer"
}

const uploadBtn = {
  cursor: "pointer",
  color: "#22c55e"
}

const btn = {
  padding: "12px",
  background: "#22c55e",
  border: "none",
  borderRadius: "8px",
  width: "100%",
  fontWeight: "bold"
}

const link = {
  color: "#22c55e",
  fontWeight: "bold"
}

const select = {
  padding: "10px",
  borderRadius: "8px",
  width: "100%"
}

const barBg = {
  width: "100%",
  height: "8px",
  background: "#333",
  borderRadius: "10px"
}

const barFill = {
  height: "8px",
  background: "#22c55e",
  borderRadius: "10px"
            }
