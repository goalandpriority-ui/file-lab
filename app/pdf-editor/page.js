"use client"

import { useState, useRef, useEffect } from "react"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js"

export default function Page() {

  const [file, setFile] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [textItems, setTextItems] = useState([])
  const [scale, setScale] = useState(1.5)

  const canvasRef = useRef(null)

  // 🔥 LOAD PDF
  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return

    setFile(f)
    loadPage(f, 0)
  }

  // 🔥 LOAD PAGE + TEXT LAYER
  const loadPage = async (fileObj, pageNum) => {
    const bytes = await fileObj.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise

    const page = await pdf.getPage(pageNum + 1)
    const viewport = page.getViewport({ scale })

    // canvas render
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise

    // 🔥 TEXT EXTRACT
    const textContent = await page.getTextContent()

    const items = textContent.items.map((item) => ({
      str: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5],
      fontSize: item.height
    }))

    setTextItems(items)
  }

  useEffect(() => {
    if (file) loadPage(file, pageIndex)
  }, [pageIndex, scale])

  // 🔥 UPDATE TEXT
  const updateText = (i, val) => {
    const updated = [...textItems]
    updated[i].str = val
    setTextItems(updated)
  }

  return (
    <main style={layout}>

      {/* 🔥 TOPBAR */}
      <div style={topbar}>
        <input type="file" onChange={handleFile} />

        <button onClick={()=>setPageIndex(p=>Math.max(0,p-1))}>Prev</button>
        <button onClick={()=>setPageIndex(p=>p+1)}>Next</button>

        <button onClick={()=>setScale(s=>s+0.2)}>Zoom +</button>
        <button onClick={()=>setScale(s=>Math.max(1,s-0.2))}>Zoom -</button>
      </div>

      {/* 🔥 VIEWER */}
      <div style={viewer}>
        <canvas ref={canvasRef} style={{background:"#fff"}} />

        {/* 🔥 TEXT LAYER */}
        {textItems.map((t, i) => (
          <input
            key={i}
            value={t.str}
            onChange={(e)=>updateText(i, e.target.value)}
            style={{
              position:"absolute",
              top:t.y,
              left:t.x,
              fontSize:t.fontSize,
              border:"none",
              background:"transparent",
              color:"red"
            }}
          />
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

const topbar = {
  display:"flex",
  gap:"10px",
  padding:"10px",
  background:"#111",
  marginBottom:"10px"
}

const viewer = {
  position:"relative"
}
