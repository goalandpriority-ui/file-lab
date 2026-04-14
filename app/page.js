"use client"

import { useState, useEffect } from "react"

export default function Home() {

  const [dark, setDark] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState([])

  // 🔥 LOAD HISTORY
  useEffect(() => {
    const saved = localStorage.getItem("history")
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  // 🔥 SAVE HISTORY
  const saveHistory = (fileName, action) => {
    const newHistory = [{ fileName, action, time: new Date().toLocaleTimeString() }, ...history]
    setHistory(newHistory)
    localStorage.setItem("history", JSON.stringify(newHistory))
  }

  // 🔥 AUTO DETECT
  const detectTool = (file) => {
    const name = file.name.toLowerCase()

    if (name.endsWith(".pdf")) return "/pdf-to-word"
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "/jpg-to-pdf"
    if (name.endsWith(".png")) return "/jpg-to-pdf"

    return null
  }

  // 🔥 HANDLE FILE
  const handleFile = (file) => {
    if (!file) return

    const route = detectTool(file)

    // 🔥 FAKE PROGRESS
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)

          if (route) {
            saveHistory(file.name, route)
            window.location.href = route
          }

          return 100
        }
        return p + 10
      })
    }, 100)
  }

  return (
    <main style={dark ? mainDark : mainLight}>

      {/* 🔥 HEADER */}
      <div style={floatingHeader}>
        <span style={{fontWeight:"700"}}>FileLab</span>

        <button onClick={()=>setDark(!dark)} style={toggleBtn}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* 🔥 HERO */}
      <div style={header}>
        <h1 style={title}>FileLab</h1>
        <p style={subtitle}>All-in-One PDF & Image Tools</p>
      </div>

      {/* 🔥 DRAG UPLOAD */}
      <div
        style={{
          ...dropZone,
          border: dragActive ? "2px dashed #22c55e" : "2px dashed #555"
        }}
        onDragOver={(e)=>{e.preventDefault();setDragActive(true)}}
        onDragLeave={()=>setDragActive(false)}
        onDrop={(e)=>{
          e.preventDefault()
          setDragActive(false)
          handleFile(e.dataTransfer.files[0])
        }}
      >
        <input 
          type="file"
          onChange={(e)=>handleFile(e.target.files[0])}
        />
        <p>Drag & Drop or Click</p>
      </div>

      {/* 🔥 PROGRESS BAR */}
      {progress > 0 && (
        <div style={progressBar}>
          <div style={{...progressFill, width: progress + "%"}} />
        </div>
      )}

      {/* 🔥 HISTORY */}
      {history.length > 0 && (
        <div style={historyBox}>
          <h3>Recent Files</h3>
          {history.slice(0,5).map((h,i)=>(
            <div key={i} style={historyItem}>
              {h.fileName} → {h.action}
            </div>
          ))}
        </div>
      )}

      {/* 🔥 SECTIONS */}
      <Section title="Convert 🔄">
        <Btn href="/pdf-to-word">📄 PDF → Word</Btn>
        <Btn href="/word-to-pdf">📝 Word → PDF</Btn>
        <Btn href="/pdf-to-jpg">🖼️ PDF → JPG</Btn>
        <Btn href="/jpg-to-pdf">📸 JPG → PDF</Btn>
      </Section>

      <Section title="Compress ⚡">
        <Btn href="/compress-pdf">📦 Compress PDF</Btn>
        <Btn href="/image-compress">🗜️ Image Compress</Btn>
      </Section>

      <Section title="Edit ✏️">
        <Btn href="/merge-pdf">📚 Merge PDF</Btn>
        <Btn href="/split-pdf">✂️ Split PDF</Btn>
        <Btn href="/pdf-editor">🧾 PDF Editor</Btn>
        <Btn href="/word-editor">📝 Word Editor</Btn>
      </Section>

    </main>
  )
}

/* 🔥 BUTTON */
function Btn({ href, children }) {
  const [pressed, setPressed] = useState(false)

  return (
    <a
      href={href}
      onMouseDown={()=>setPressed(true)}
      onMouseUp={()=>setPressed(false)}
      style={{
        ...btn,
        transform: pressed ? "scale(0.95)" : "scale(1)"
      }}
    >
      {children}
    </a>
  )
}

/* 🔥 SECTION */
function Section({ title, children }) {
  return (
    <div style={section}>
      <h2 style={sectionTitle}>{title}</h2>
      <div style={grid}>{children}</div>
    </div>
  )
}

/* 🔥 STYLES */

const mainDark = {
  minHeight: "100vh",
  background: "#020617",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  color: "#fff"
}

const mainLight = {
  minHeight: "100vh",
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  color: "#000"
}

const floatingHeader = {
  position: "fixed",
  top: "10px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  padding: "8px 16px",
  borderRadius: "20px",
  display: "flex",
  gap: "10px",
  zIndex: 10
}

const toggleBtn = {
  background: "none",
  border: "none",
  cursor: "pointer"
}

const header = {
  textAlign: "center",
  marginTop: "70px"
}

const title = {
  fontSize: "42px",
  fontWeight: "700"
}

const subtitle = {
  opacity: 0.6
}

const dropZone = {
  width: "100%",
  maxWidth: "360px",
  padding: "20px",
  textAlign: "center",
  borderRadius: "12px",
  margin: "20px 0"
}

const progressBar = {
  width: "100%",
  maxWidth: "360px",
  height: "6px",
  background: "#333",
  borderRadius: "10px",
  overflow: "hidden"
}

const progressFill = {
  height: "100%",
  background: "#22c55e"
}

const historyBox = {
  width: "100%",
  maxWidth: "360px",
  marginTop: "10px"
}

const historyItem = {
  fontSize: "12px",
  opacity: 0.7
}

const section = {
  width: "100%",
  maxWidth: "360px",
  marginTop: "20px"
}

const sectionTitle = {
  fontSize: "14px",
  opacity: 0.6
}

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px"
}

const btn = {
  padding: "16px",
  borderRadius: "16px",
  textAlign: "center",
  textDecoration: "none",
  fontWeight: "600",
  color: "#000",
  background: "linear-gradient(145deg,#22c55e,#16a34a)"
}
