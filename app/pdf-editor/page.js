"use client"

import { useState, useRef, useEffect } from "react"
import * as pdfjsLib from "pdfjs-dist/build/pdf"
import "pdfjs-dist/build/pdf.worker.entry"

export default function Page() {

  const [file, setFile] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [scale, setScale] = useState(1.2)

  const [docUrl, setDocUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")

  const canvasRef = useRef(null)

  // 🔥 LOAD PDF
  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return

    setFile(f)
    renderPage(f, 0)
  }

  // 🔥 RENDER PDF
  const renderPage = async (fileObj, pageNum) => {
    const bytes = await fileObj.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
    const page = await pdf.getPage(pageNum + 1)

    const viewport = page.getViewport({ scale })

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({ canvasContext: ctx, viewport }).promise
  }

  useEffect(() => {
    if (file) renderPage(file, pageIndex)
  }, [pageIndex, scale])

  // 🔥 ADOBE CONVERT → WORD
  const handleConvert = async () => {
    if (!file) return alert("Upload PDF")

    setLoading(true)
    setStatus("🤖 Converting to editable format...")

    const form = new FormData()
    form.append("file", file)

    const res = await fetch("/api/pdf-to-word", {
      method: "POST",
      body: form
    })

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    setDocUrl(url)

    setLoading(false)
    setStatus("✅ Editable document ready")
  }

  // 🔥 DOWNLOAD FINAL PDF
  const handleDownload = async () => {
    if (!docUrl) return

    setLoading(true)
    setStatus("💾 Converting back to PDF...")

    const fileBlob = await fetch(docUrl).then(r => r.blob())

    const form = new FormData()
    form.append("file", fileBlob, "edited.docx")

    const res = await fetch("/api/word-to-pdf", {
      method: "POST",
      body: form
    })

    const pdfBlob = await res.blob()
    const url = URL.createObjectURL(pdfBlob)

    const a = document.createElement("a")
    a.href = url
    a.download = "edited.pdf"
    a.click()

    setLoading(false)
    setStatus("✅ Download ready")
    setTimeout(()=>setStatus(""),2000)
  }

  return (
    <main style={main}>

      {/* 🔥 TOOLBAR */}
      <div style={toolbar}>
        <input type="file" onChange={handleFile} />

        <button style={btn} onClick={handleConvert}>
          ✨ Make Editable
        </button>

        <button style={btn} onClick={()=>setScale(s=>s+0.2)}>➕</button>
        <button style={btn} onClick={()=>setScale(s=>Math.max(1,s-0.2))}>➖</button>

        <button style={btn} onClick={()=>setPageIndex(p=>Math.max(0,p-1))}>Prev</button>
        <button style={btn} onClick={()=>setPageIndex(p=>p+1)}>Next</button>

        <button style={btn} onClick={handleDownload}>
          💾 Save
        </button>
      </div>

      {/* 🔥 LOADING */}
      {loading && (
        <div style={loaderBox}>
          <div style={spinner}></div>
          <p>{status}</p>
        </div>
      )}

      {/* 🔥 VIEW */}
      <div style={viewer}>

        {/* ORIGINAL PDF */}
        {!docUrl && (
          <canvas ref={canvasRef} style={{background:"#fff"}} />
        )}

        {/* EDITABLE WORD VIEW */}
        {docUrl && (
          <iframe
            src={docUrl}
            style={{
              width:"80%",
              height:"600px",
              border:"none",
              background:"#fff"
            }}
          />
        )}

      </div>

    </main>
  )
}

/* 🔥 STYLES */

const main = {
  background:"#020617",
  color:"#fff",
  minHeight:"100vh"
}

const toolbar = {
  padding:"10px",
  background:"#111",
  display:"flex",
  gap:"10px",
  flexWrap:"wrap"
}

const btn = {
  padding:"8px 12px",
  background:"#22c55e",
  border:"none",
  borderRadius:"8px",
  fontWeight:"600",
  cursor:"pointer"
}

const viewer = {
  display:"flex",
  justifyContent:"center",
  marginTop:"10px"
}

const loaderBox = {
  display:"flex",
  flexDirection:"column",
  alignItems:"center",
  marginTop:"10px"
}

const spinner = {
  width:"30px",
  height:"30px",
  border:"4px solid #22c55e",
  borderTop:"4px solid transparent",
  borderRadius:"50%",
  animation:"spin 1s linear infinite"
}
