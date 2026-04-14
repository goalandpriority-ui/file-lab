"use client"

import { useState, useRef, useEffect } from "react"
import * as pdfjsLib from "pdfjs-dist/build/pdf"
import "pdfjs-dist/build/pdf.worker.entry"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import Draggable from "react-draggable"

export default function Page() {

  const [file, setFile] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [texts, setTexts] = useState([])
  const [color, setColor] = useState("#ff0000")
  const [fontSize, setFontSize] = useState(16)

  const canvasRef = useRef(null)

  // 🔥 LOAD FILE
  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return

    setFile(f)
    renderPage(f, 0)
  }

  // 🔥 RENDER PAGE
  const renderPage = async (fileObj, pageNum) => {
    const bytes = await fileObj.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
    const page = await pdf.getPage(pageNum + 1)

    const viewport = page.getViewport({ scale })

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise
  }

  useEffect(() => {
    if (file) renderPage(file, pageIndex)
  }, [pageIndex, scale])

  // 🔥 ADD TEXT
  const addText = () => {
    setTexts([
      ...texts,
      {
        x: 100,
        y: 150,
        text: "Edit me",
        size: fontSize,
        color,
        page: pageIndex
      }
    ])
  }

  // 🔥 UPDATE TEXT
  const updateText = (i, val) => {
    const updated = [...texts]
    updated[i].text = val
    setTexts(updated)
  }

  // 🔥 SAVE PDF (REAL)
  const handleDownload = async () => {
    if (!file) return

    const bytes = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(bytes)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    texts.forEach((t) => {
      const page = pdfDoc.getPages()[t.page]

      page.drawText(t.text, {
        x: t.x,
        y: t.y,
        size: t.size,
        font,
        color: rgb(
          parseInt(t.color.slice(1, 3), 16) / 255,
          parseInt(t.color.slice(3, 5), 16) / 255,
          parseInt(t.color.slice(5, 7), 16) / 255
        )
      })
    })

    const pdfBytes = await pdfDoc.save()

    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "edited.pdf"
    a.click()
  }

  return (
    <main style={layout}>

      {/* 🔥 TOOLBAR */}
      <div style={toolbar}>
        <input type="file" onChange={handleFile} />

        <button onClick={addText}>✏️ Text</button>

        <input 
          type="color" 
          value={color} 
          onChange={(e)=>setColor(e.target.value)} 
        />

        <input
          type="range"
          min="10"
          max="40"
          value={fontSize}
          onChange={(e)=>setFontSize(Number(e.target.value))}
        />

        <button onClick={()=>setScale(s=>s+0.2)}>➕</button>
        <button onClick={()=>setScale(s=>Math.max(0.5,s-0.2))}>➖</button>

        <button onClick={()=>setPageIndex(p=>Math.max(0,p-1))}>Prev</button>
        <button onClick={()=>setPageIndex(p=>p+1)}>Next</button>

        <button onClick={handleDownload}>💾 Save</button>
      </div>

      {/* 🔥 VIEWER */}
      <div style={viewer}>
        <canvas ref={canvasRef} />

        {texts
          .filter(t => t.page === pageIndex)
          .map((t, i) => (
          <Draggable
            key={i}
            onStop={(e, data) => {
              const updated = [...texts]
              updated[i].x = data.x
              updated[i].y = data.y
              setTexts(updated)
            }}
          >
            <div style={{
              position:"absolute",
              top:t.y,
              left:t.x
            }}>
              <input
                value={t.text}
                onChange={(e)=>updateText(i, e.target.value)}
                style={{
                  fontSize:t.size,
                  color:t.color,
                  background:"rgba(0,0,0,0.3)",
                  border:"none"
                }}
              />
            </div>
          </Draggable>
        ))}
      </div>

    </main>
  )
}

/* 🔥 STYLES */

const layout = {
  minHeight:"100vh",
  background:"#020617",
  color:"#fff",
  display:"flex",
  flexDirection:"column",
  alignItems:"center"
}

const toolbar = {
  display:"flex",
  gap:"10px",
  padding:"10px",
  background:"#111",
  flexWrap:"wrap"
}

const viewer = {
  position:"relative",
  marginTop:"10px"
  }
