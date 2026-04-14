"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabase"

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })
import "react-quill/dist/quill.snow.css"

export default function Page() {

  const [pages, setPages] = useState([""])
  const [dragged, setDragged] = useState(null)

  // 🔥 LOAD SAVED (LOCAL)
  useEffect(() => {
    const saved = localStorage.getItem("doc")
    if (saved) setPages(JSON.parse(saved))
  }, [])

  // 🔥 AUTO SAVE
  useEffect(() => {
    localStorage.setItem("doc", JSON.stringify(pages))
  }, [pages])

  // 🔥 UPDATE PAGE
  const updatePage = (index, value) => {
    const updated = [...pages]
    updated[index] = value

    if (value.length > 1500) {
      const half = value.slice(0, 1000)
      const rest = value.slice(1000)

      updated[index] = half
      updated.splice(index + 1, 0, rest)
    }

    setPages(updated)
  }

  // 🔥 ADD PAGE
  const addPage = () => {
    setPages([...pages, ""])
  }

  // 🔥 REMOVE PAGE
  const removePage = (index) => {
    if (pages.length === 1) return
    const updated = pages.filter((_, i) => i !== index)
    setPages(updated)
  }

  // 🔥 DRAG
  const dragStart = (i) => setDragged(i)

  const drop = (i) => {
    if (dragged === null) return

    const updated = [...pages]
    const temp = updated[dragged]
    updated[dragged] = updated[i]
    updated[i] = temp

    setPages(updated)
    setDragged(null)
  }

  // 🔥 TEMPLATE
  const loadTemplate = () => {
    setPages([`
      <h1>John Doe</h1>
      <p>Email: example@gmail.com</p>
      <h2>Skills</h2>
      <ul><li>React</li><li>JavaScript</li></ul>
      <h2>Experience</h2>
      <p>Worked at XYZ company</p>
    `])
  }

  // 🔥 DOWNLOAD DOC + SAVE
  const downloadDoc = async () => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      alert("Login required 🔐")
      window.location.href = "/login"
      return
    }

    const full = pages.join("<div style='page-break-after:always'></div>")

    const blob = new Blob([full], { type: "application/msword" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "document.doc"
    a.click()

    // 🔥 SAVE
    await supabase.from("files").insert([
      {
        user_id: userData.user.id,
        name: "document.doc",
        type: "word-editor",
        file_url: url
      }
    ])
  }

  // 🔥 DOWNLOAD PDF + SAVE
  const downloadPDF = async () => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      alert("Login required 🔐")
      window.location.href = "/login"
      return
    }

    const full = pages.join("<div style='page-break-after:always'></div>")

    const win = window.open("", "", "width=800,height=600")
    win.document.write(full)
    win.print()

    // 🔥 SAVE (no direct URL)
    await supabase.from("files").insert([
      {
        user_id: userData.user.id,
        name: "document.pdf",
        type: "word-editor",
        file_url: "" // print-based
      }
    ])
  }

  return (
    <main style={layout}>
      <h1>Word Editor Ultra 😈</h1>

      {/* 🔥 TOOLBAR */}
      <div style={{display:"flex", gap:"10px", flexWrap:"wrap"}}>
        <button onClick={addPage}>➕ Page</button>
        <button onClick={loadTemplate}>📄 Resume Template</button>
        <button onClick={downloadDoc}>DOC</button>
        <button onClick={downloadPDF}>PDF</button>
      </div>

      {/* 🔥 PAGES */}
      <div style={pageContainer}>
        {pages.map((p, i) => (
          <div
            key={i}
            draggable
            onDragStart={()=>dragStart(i)}
            onDragOver={(e)=>e.preventDefault()}
            onDrop={()=>drop(i)}
            style={pageBox}
          >

            <div style={{display:"flex", justifyContent:"space-between"}}>
              <span>Page {i+1}</span>
              <button onClick={()=>removePage(i)}>❌</button>
            </div>

            <ReactQuill
              theme="snow"
              value={p}
              onChange={(val)=>updatePage(i, val)}
              style={{background:"#fff", color:"#000", height:"250px"}}
            />

          </div>
        ))}
      </div>

    </main>
  )
}

// 🔥 STYLES

const layout = {
  display:"flex",
  flexDirection:"column",
  gap:"20px",
  padding:"20px",
  background:"#020617",
  color:"#fff",
  minHeight:"100vh"
}

const pageContainer = {
  display:"flex",
  flexDirection:"column",
  gap:"20px",
  alignItems:"center"
}

const pageBox = {
  width:"600px",
  minHeight:"300px",
  background:"#fff",
  color:"#000",
  padding:"10px",
  borderRadius:"10px",
  cursor:"grab"
}
