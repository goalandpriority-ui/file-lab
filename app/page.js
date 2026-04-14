"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {

  const [dark, setDark] = useState(true)
  const [user, setUser] = useState(null)

  // 🔥 GET USER
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  return (
    <main style={dark ? mainDark : mainLight}>

      {/* 🔥 TOP BAR */}
      <div style={topBar}>

        {/* 🔥 LOGIN / PROFILE */}
        {user ? (
          <a href="/history" style={profileBtn}>
            {user.email}
          </a>
        ) : (
          <a href="/login" style={profileBtn}>
            Login
          </a>
        )}

        {/* 🌙 TOGGLE */}
        <button 
          onClick={()=>setDark(!dark)} 
          style={toggleBtn}
        >
          {dark ? "☀️" : "🌙"}
        </button>

      </div>

      {/* 🔥 HERO */}
      <div style={hero}>
        <h1 style={title}>FileLab</h1>
        <p style={subtitle}>All-in-One PDF & Image Tools</p>
      </div>

      {/* 🔥 CONVERT */}
      <Section title="⚡ Convert">
        <Btn href="/pdf-to-word">📄 PDF → Word</Btn>
        <Btn href="/word-to-pdf">📝 Word → PDF</Btn>
        <Btn href="/pdf-to-jpg">🖼️ PDF → JPG</Btn>
        <Btn href="/jpg-to-pdf">📸 JPG → PDF</Btn>
      </Section>

      {/* 🔥 COMPRESS */}
      <Section title="📦 Compress">
        <Btn href="/compress-pdf">📦 Compress PDF</Btn>
        <Btn href="/image-compress">🗜️ Image Compress</Btn>
      </Section>

      {/* 🔥 EDIT */}
      <Section title="✏️ Edit">
        <Btn href="/merge-pdf">📚 Merge PDF</Btn>
        <Btn href="/split-pdf">✂️ Split PDF</Btn>
        <Btn href="/pdf-editor">🧾 PDF Editor</Btn>
        <Btn href="/word-editor">📝 Word Editor</Btn>
      </Section>

      {/* 🔥 FOOTER */}
      <div style={footer}>
        <p>© 2026 FileLab</p>
      </div>

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
      onTouchStart={()=>setPressed(true)}
      onTouchEnd={()=>setPressed(false)}
      onMouseEnter={(e)=>e.target.style.opacity=0.8}
      onMouseLeave={(e)=>e.target.style.opacity=1}
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

// 🌙 DARK
const mainDark = {
  minHeight: "100vh",
  background: "#020617",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  color: "#fff"
}

// ☀️ LIGHT
const mainLight = {
  minHeight: "100vh",
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  color: "#000"
}

// 🔥 TOP BAR
const topBar = {
  width: "100%",
  maxWidth: "420px",
  display: "flex",
  justifyContent: "space-between",
  marginTop: "10px",
  alignItems: "center"
}

const toggleBtn = {
  background: "rgba(255,255,255,0.1)",
  border: "none",
  borderRadius: "50%",
  padding: "10px",
  cursor: "pointer",
  fontSize: "16px"
}

const profileBtn = {
  padding: "8px 12px",
  borderRadius: "10px",
  background: "#111",
  color: "#fff",
  textDecoration: "none",
  fontSize: "12px"
}

// 🔥 HERO
const hero = {
  textAlign: "center",
  marginTop: "20px",
  marginBottom: "30px"
}

const title = {
  fontSize: "42px",
  fontWeight: "700",
  letterSpacing: "-1px"
}

const subtitle = {
  opacity: 0.6,
  fontSize: "14px",
  marginTop: "6px"
}

// 🔥 SECTION
const section = {
  width: "100%",
  maxWidth: "360px",
  marginTop: "25px"
}

const sectionTitle = {
  fontSize: "13px",
  opacity: 0.5,
  marginBottom: "10px"
}

// 🔥 GRID
const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px"
}

// 🔥 BUTTON
const btn = {
  padding: "18px",
  borderRadius: "18px",
  textAlign: "center",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
  color: "#000",
  background: "linear-gradient(145deg,#22c55e,#16a34a)",
  boxShadow: "0 8px 25px rgba(34,197,94,0.25)",
  transition: "all 0.15s ease"
}

// 🔥 FOOTER
const footer = {
  marginTop: "40px",
  opacity: 0.4,
  fontSize: "12px"
  }
