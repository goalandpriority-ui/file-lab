"use client"

import { useState, useRef, useEffect } from "react"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import Draggable from "react-draggable"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js"

export default function Page() {

  const [file, setFile] = useState(null)
  const [texts, setTexts] = useState([])
  const [pageIndex, setPageIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [images, setImages] = useState([])
  const [color, setColor] = useState("#ff0000")
  const [size, setSize] = useState(16)
  const [sign, setSign] = useState(null)

  const canvasRef = useRef(null)

  // 🔥 LOAD FILE + THUMBNAILS
  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return

    setFile(f)

    const bytes = await f.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise

    // thumbnails
    const imgs = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 0.3 })

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({ canvasContext: ctx, viewport }).promise

      imgs.push(canvas.toDataURL())
    }

    setImages(imgs)
    renderPage(pdf, pageIndex)
  }

  // 🔥 RENDER PAGE
  const renderPage = async (pdfInstance = null, pageNum = pageIndex) => {
    if (!file && !pdfInstance) return

    const bytes = await file.arrayBuffer()
    const pdf =
      pdfInstance || (await pdfjsLib.getDocument({ data: bytes }).promise)

    const page = await pdf.getPage(pageNum + 1)
    const viewport = page.getViewport({ scale: zoom })

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
    if (file) renderPage()
  }, [pageIndex, zoom])

  // 🔥 ADD TEXT
  const addText = () => {
    setTexts([
      ...texts,
      { x: 50, y: 100, text: "Edit", size, color, page: pageIndex }
    ])
  }

  // 🔥 DRAW
  const draw = (e) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(e.nativeEvent.offsetX, e.nativeEvent.offsetY, 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  // 🔥 SIGN
  const handleSign = (e) => {
    const img = e.target.files[0]
    if (img) setSign(URL.createObjectURL(img))
  }

  // 🔥 DOWNLOAD
  const handleDownload = async () => {
    if (!file) return

    const bytes = await file.arrayBuffer()
    const pdf = await PDFDocument.load(bytes)
    const pages = pdf.getPages()
    const font = await pdf.embedFont(StandardFonts.Helvetica)

    texts.forEach((t) => {
      pages[t.page].drawText(t.text, {
        x: t.x,
        y: t.y,
        size: t.size,
        font,
        color: rgb(1, 0, 0)
      })
    })

    const pdfBytes = await pdf.save()
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
      <div style={topbar}>
        <input type="file" onChange={handleFile} />
        <button onClick={addText}>Text</button>

        <input type="color" value={color} onChange={(e)=>setColor(e.target.value)} />

        <input
          type="range"
          min="10"
          max="40"
          value={size}
          onChange={(e)=>setSize(Number(e.target.value))}
        />

        <button onClick={()=>setZoom(z=>z+0.2)}>+</button>
        <button onClick={()=>setZoom(z=>Math.max(0.5, z-0.2))}>-</button>

        <input type="file" accept="image/*" onChange={handleSign} />

        <button onClick={handleDownload}>Download</button>
      </div>

      <div style={container}>

        {/* 🔥 THUMBNAILS */}
        <div style={sidebar}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              onClick={()=>setPageIndex(i)}
              style={{
                width:"100%",
                marginBottom:"10px",
                border: pageIndex===i ? "2px solid #22c55e" : "none"
              }}
            />
          ))}
        </div>

        {/* 🔥 VIEWER */}
        <div style={viewer}>

          <canvas
            ref={canvasRef}
            onMouseMove={(e)=>e.buttons===1 && draw(e)}
            style={{borderRadius:"10px", background:"#fff"}}
          />

          {/* TEXT */}
          {texts.filter(t=>t.page===pageIndex).map((t,i)=>(
            <Draggable
              key={i}
              onStop={(e,data)=>{
                const updated=[...texts]
                updated[i].x=data.x
                updated[i].y=data.y
                setTexts(updated)
              }}
            >
              <div style={{
                position:"absolute",
                top:t.y,
                left:t.x,
                color:t.color,
                fontSize:t.size
              }}>
                <input
                  value={t.text}
                  onChange={(e)=>{
                    const updated=[...texts]
                    updated[i].text=e.target.value
                    setTexts(updated)
                  }}
                  style={{background:"transparent",border:"none",color:t.color}}
                />
              </div>
            </Draggable>
          ))}

          {/* SIGN */}
          {sign && (
            <img
              src={sign}
              style={{
                position:"absolute",
                bottom:"20px",
                left:"20px",
                width:"100px"
              }}
            />
          )}

        </div>

      </div>

    </main>
  )
}

/* 🔥 STYLES */

const layout = {
  height:"100vh",
  display:"flex",
  flexDirection:"column",
  background:"#020617",
  color:"#fff"
}

const topbar = {
  display:"flex",
  gap:"10px",
  padding:"10px",
  background:"#111",
  flexWrap:"wrap"
}

const container = {
  flex:1,
  display:"flex"
}

const sidebar = {
  width:"90px",
  background:"#111",
  padding:"10px",
  overflowY:"auto"
}

const viewer = {
  flex:1,
  position:"relative",
  display:"flex",
  justifyContent:"center",
  alignItems:"center"
                   }
