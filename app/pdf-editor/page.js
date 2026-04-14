"use client"

import { useState, useRef, useEffect } from "react"

// 🔥 IMPORTANT FIX (DIFFERENT IMPORT)
import * as pdfjsLib from "pdfjs-dist/build/pdf"

// 🔥 WORKER FIX (LOCAL SAFE)
import "pdfjs-dist/build/pdf.worker.entry"

export default function Page() {

  const [file, setFile] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [textItems, setTextItems] = useState([])
  const [scale, setScale] = useState(1.2)

  const canvasRef = useRef(null)

  // 🔥 FILE LOAD
  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return

    setFile(f)

    try {
      await loadPage(f, 0)
    } catch (err) {
      console.error(err)
      alert("PDF load failed ❌")
    }
  }

  // 🔥 MAIN RENDER
  const loadPage = async (fileObj, pageNum) => {

    const bytes = await fileObj.arrayBuffer()

    const pdf = await pdfjsLib.getDocument({
      data: bytes
    }).promise

    const page = await pdf.getPage(pageNum + 1)

    const viewport = page.getViewport({ scale })

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    const dpr = window.devicePixelRatio || 1

    canvas.width = viewport.width * dpr
    canvas.height = viewport.height * dpr

    canvas.style.width = viewport.width + "px"
    canvas.style.height = viewport.height + "px"

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise

    // 🔥 TEXT
    const textContent = await page.getTextContent()

    const items = textContent.items.map((item) => ({
      str: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5],
      fontSize: item.height || 14
    }))

    setTextItems(items)
  }

  useEffect(() => {
    if (file) loadPage(file, pageIndex)
  }, [pageIndex, scale])

  const updateText = (i, val) => {
    const updated = [...textItems]
    updated[i].str = val
    setTextItems(updated)
  }

  return (
    <main style={layout}>

      <div style={topbar}>
        <input type="file" onChange={handleFile} />

        <button onClick={()=>setPageIndex(p=>Math.max(0,p-1))}>Prev</button>
        <button onClick={()=>setPageIndex(p=>p+1)}>Next</button>

        <button onClick={()=>setScale(s=>s+0.2)}>Zoom +</button>
        <button onClick={()=>setScale(s=>Math.max(0.5,s-0.2))}>Zoom -</button>
      </div>

      <div style={viewer}>
        <canvas ref={canvasRef} style={{background:"#fff"}} />

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
              background:"rgba(0,0,0,0.1)",
              color:"red"
            }}
          />
        ))}
      </div>

    </main>
  )
}

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
  marginBottom:"10px",
  flexWrap:"wrap"
}

const viewer = {
  position:"relative",
  overflow:"auto",
  padding:"20px"
}
