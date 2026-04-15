"use client"

import { useState, useRef, useEffect } from "react"
import * as pdfjsLib from "pdfjs-dist/build/pdf"
import "pdfjs-dist/build/pdf.worker.entry"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import Draggable from "react-draggable"
import Tesseract from "tesseract.js"

export default function Page() {

  const [file, setFile] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [scale, setScale] = useState(1.2)

  const [texts, setTexts] = useState([])
  const [mode, setMode] = useState("text")

  const [findText, setFindText] = useState("")
  const [replaceText, setReplaceText] = useState("")

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")

  const canvasRef = useRef(null)

  // 🔥 LOAD PDF
  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return

    setLoading(true)
    setStatus("Rendering PDF...")

    setFile(f)
    await renderPage(f, 0)

    setLoading(false)
    setStatus("")
  }

  // 🔥 RENDER
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

  // 🔥 OCR
  const runOCR = async () => {
    const canvas = canvasRef.current

    setLoading(true)
    setStatus("🤖 AI analyzing document...")

    const { data } = await Tesseract.recognize(canvas, "eng")

    setStatus("🧠 Detecting text layers...")

    const words = data.words.map(w => ({
      x: w.bbox.x0,
      y: w.bbox.y0,
      text: w.text,
      size: w.bbox.y1 - w.bbox.y0,
      color: "#ff0000",
      page: pageIndex
    }))

    setTexts(words)

    setLoading(false)
    setStatus("✅ AI processing complete")
    setTimeout(()=>setStatus(""),2000)
  }

  // 🔥 REPLACE
  const handleReplace = () => {
    if (!findText) return

    const updated = texts.map(t => ({
      ...t,
      text: t.text.toLowerCase().includes(findText.toLowerCase())
        ? replaceText
        : t.text
    }))

    setTexts(updated)
  }

  // 🔥 SAVE
  const handleDownload = async () => {
    if (!file) return

    setLoading(true)
    setStatus("💾 Generating PDF...")

    const bytes = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(bytes)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const page = pdfDoc.getPages()[pageIndex]

    texts.forEach((t) => {
      page.drawText(t.text, {
        x: t.x,
        y: t.y,
        size: t.size || 14,
        font,
        color: rgb(1, 0, 0)
      })
    })

    const pdfBytes = await pdfDoc.save()

    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)

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

      {/* 🔥 TOP BAR */}
      <div style={toolbar}>
        <input type="file" onChange={handleFile} />

        <button style={btn} onClick={runOCR}>🧠 OCR</button>

        <button style={btn} onClick={()=>setScale(s=>s+0.2)}>➕</button>
        <button style={btn} onClick={()=>setScale(s=>Math.max(1,s-0.2))}>➖</button>

        <button style={btn} onClick={()=>setPageIndex(p=>Math.max(0,p-1))}>Prev</button>
        <button style={btn} onClick={()=>setPageIndex(p=>p+1)}>Next</button>

        <button style={btn} onClick={handleDownload}>💾 Save</button>
      </div>

      {/* 🔥 STATUS */}
      {loading && (
        <div style={loaderBox}>
          <div style={spinner}></div>
          <p>{status}</p>
        </div>
      )}

      {/* 🔥 AI BAR */}
      <div style={aiBar}>
        <input
          placeholder="Find text"
          value={findText}
          onChange={(e)=>setFindText(e.target.value)}
        />
        <input
          placeholder="Replace with"
          value={replaceText}
          onChange={(e)=>setReplaceText(e.target.value)}
        />
        <button style={btn} onClick={handleReplace}>⚡ Replace</button>
      </div>

      {/* 🔥 VIEW */}
      <div style={viewer}>
        <canvas ref={canvasRef} style={{background:"#fff"}} />

        {texts.map((t, i) => (
          <Draggable key={i}>
            <input
              value={t.text}
              onChange={(e)=>{
                const updated=[...texts]
                updated[i].text=e.target.value
                setTexts(updated)
              }}
              style={{
                position:"absolute",
                top:t.y,
                left:t.x,
                fontSize:t.size,
                color:"red",
                background:"transparent",
                border:"none"
              }}
            />
          </Draggable>
        ))}
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

const aiBar = {
  padding:"10px",
  background:"#0f172a",
  display:"flex",
  gap:"10px"
}

const viewer = {
  position:"relative",
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
