"use client"

import { useState, useRef } from "react"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import Draggable from "react-draggable"
import { supabase } from "@/lib/supabase"

export default function Page() {
  const [file, setFile] = useState(null)
  const [pdfUrl, setPdfUrl] = useState("")
  const [texts, setTexts] = useState([])
  const [sign, setSign] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [history, setHistory] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const canvasRef = useRef(null)

  // 🔥 LOAD PDF
  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return

    setFile(f)
    setPdfUrl(URL.createObjectURL(f))
  }

  // 🔥 SAVE HISTORY
  const saveHistory = (state) => {
    setHistory([...history, JSON.stringify(state)])
    setRedoStack([])
  }

  // 🔥 UNDO
  const undo = () => {
    if (!history.length) return
    const last = history[history.length - 1]
    setRedoStack([...redoStack, JSON.stringify(texts)])
    setTexts(JSON.parse(last))
    setHistory(history.slice(0, -1))
  }

  // 🔥 REDO
  const redo = () => {
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    setHistory([...history, JSON.stringify(texts)])
    setTexts(JSON.parse(next))
    setRedoStack(redoStack.slice(0, -1))
  }

  // 🔥 ADD TEXT
  const addText = () => {
    saveHistory(texts)
    setTexts([...texts, { x: 50, y: 100, text: "Edit me", size: 20, page: pageIndex }])
  }

  // 🔥 UPDATE TEXT
  const updateText = (i, val) => {
    const updated = [...texts]
    updated[i].text = val
    setTexts(updated)
  }

  // 🔥 RESIZE TEXT
  const resizeText = (i, size) => {
    const updated = [...texts]
    updated[i].size = size
    setTexts(updated)
  }

  // 🔥 SIGN
  const handleSign = (e) => {
    const img = e.target.files[0]
    if (img) setSign(URL.createObjectURL(img))
  }

  // 🔥 DRAW TOOL
  const draw = (e) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "red"
    ctx.beginPath()
    ctx.arc(e.nativeEvent.offsetX, e.nativeEvent.offsetY, 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  // 🔥 DOWNLOAD + SAVE
  const handleDownload = async () => {
    if (!file) return

    // 🔥 LOGIN CHECK
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      alert("Login required 🔐")
      window.location.href = "/login"
      return
    }

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

    if (sign) {
      const imgBytes = await fetch(sign).then(res => res.arrayBuffer())
      const imgEmbed = await pdf.embedPng(imgBytes)

      pages[pageIndex].drawImage(imgEmbed, {
        x: 50,
        y: 50,
        width: 100,
        height: 50
      })
    }

    const pdfBytes = await pdf.save()
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)

    // 🔥 DOWNLOAD
    const a = document.createElement("a")
    a.href = url
    a.download = "edited.pdf"
    a.click()

    // 🔥 SAVE TO DB
    await supabase.from("files").insert([
      {
        user_id: userData.user.id,
        name: "edited.pdf",
        type: "pdf-editor",
        file_url: url
      }
    ])
  }

  return (
    <main style={layout}>
      <h1>PDF Editor Ultra 😈</h1>

      <input type="file" accept="application/pdf" onChange={handleFile} />

      <div style={{display:"flex", gap:"10px"}}>
        <button onClick={addText}>Add Text</button>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
        <input type="file" accept="image/*" onChange={handleSign}/>
      </div>

      <div style={{display:"flex", gap:"10px"}}>
        <button onClick={()=>setPageIndex(p=>Math.max(p-1,0))}>Prev</button>
        <button onClick={()=>setPageIndex(p=>p+1)}>Next</button>
      </div>

      {pdfUrl && (
        <div style={{position:"relative"}}>
          <iframe src={pdfUrl + "#page=" + (pageIndex+1)} width="500" height="600" />

          <canvas
            ref={canvasRef}
            width={500}
            height={600}
            onMouseMove={(e)=>e.buttons===1 && draw(e)}
            style={{position:"absolute", top:0, left:0}}
          />

          {texts
            .filter(t=>t.page===pageIndex)
            .map((t, i) => (
            <Draggable
              key={i}
              onStop={(e, data) => {
                const updated = [...texts]
                updated[i].x = data.x
                updated[i].y = 600 - data.y
                setTexts(updated)
              }}
            >
              <div style={{position:"absolute", top:t.y, left:t.x}}>
                <input
                  value={t.text}
                  onChange={(e)=>updateText(i, e.target.value)}
                />
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={t.size}
                  onChange={(e)=>resizeText(i, e.target.value)}
                />
              </div>
            </Draggable>
          ))}

          {sign && (
            <img src={sign} style={{
              position:"absolute",
              bottom:"20px",
              left:"20px",
              width:"100px"
            }}/>
          )}
        </div>
      )}

      <button onClick={handleDownload} style={btn}>
        Download PDF 🔥
      </button>
    </main>
  )
}

// 🔥 STYLES

const layout = {
  display:"flex",
  flexDirection:"column",
  alignItems:"center",
  gap:"20px",
  background:"#020617",
  color:"#fff",
  padding:"20px",
  minHeight:"100vh"
}

const btn = {
  padding:"12px",
  background:"#22c55e",
  border:"none",
  borderRadius:"8px"
              }
