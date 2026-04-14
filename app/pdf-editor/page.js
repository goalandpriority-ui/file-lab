"use client"

import { useState } from "react"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export default function Page() {
  const [file, setFile] = useState(null)
  const [text, setText] = useState("Hello PDF")
  const [loading, setLoading] = useState(false)

  const handleEdit = async () => {
    if (!file) return alert("Upload PDF")

    setLoading(true)

    const bytes = await file.arrayBuffer()

    const pdfDoc = await PDFDocument.load(bytes)
    const pages = pdfDoc.getPages()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // 🔥 Add text to first page
    pages[0].drawText(text, {
      x: 50,
      y: 500,
      size: 24,
      font,
      color: rgb(1, 0, 0)
    })

    const pdfBytes = await pdfDoc.save()

    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "edited.pdf"
    a.click()

    setLoading(false)
  }

  return (
    <main style={{
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      padding:"20px",
      background:"#020617",
      color:"#fff",
      minHeight:"100vh",
      gap:"20px"
    }}>

      <h1>PDF Editor Advanced</h1>

      <input 
        type="file"
        accept="application/pdf"
        onChange={(e)=>setFile(e.target.files[0])}
      />

      <input 
        placeholder="Enter text to add"
        value={text}
        onChange={(e)=>setText(e.target.value)}
        style={{
          padding:"10px",
          borderRadius:"8px"
        }}
      />

      <button 
        onClick={handleEdit}
        disabled={loading}
        style={{
          padding:"10px 20px",
          background:"#22c55e",
          border:"none",
          borderRadius:"8px"
        }}
      >
        {loading ? "Editing..." : "Add Text & Download"}
      </button>

    </main>
  )
          }
