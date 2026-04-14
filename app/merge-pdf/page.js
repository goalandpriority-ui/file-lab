"use client"

import { useState } from "react"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { supabase } from "@/lib/supabase"

export default function Page() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [addPageNumbers, setAddPageNumbers] = useState(false)

  // 🔥 ADD FILES
  const handleFiles = (e) => {
    setFiles([...files, ...Array.from(e.target.files)])
  }

  // 🔥 REMOVE FILE
  const removeFile = (index) => {
    const updated = [...files]
    updated.splice(index, 1)
    setFiles(updated)
  }

  // 🔥 MOVE (REORDER)
  const moveFile = (index, dir) => {
    const updated = [...files]
    const target = index + dir
    if (target < 0 || target >= files.length) return

    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp

    setFiles(updated)
  }

  // 🔥 MERGE
  const handleMerge = async () => {
    if (!files.length) return alert("Select PDFs")

    // 🔥 LOGIN CHECK
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      alert("Login required 🔐")
      window.location.href = "/login"
      return
    }

    setLoading(true)

    try {
      const mergedPdf = await PDFDocument.create()
      const font = await mergedPdf.embedFont(StandardFonts.Helvetica)

      let pageCount = 1

      for (let file of files) {
        const bytes = await file.arrayBuffer()
        const pdf = await PDFDocument.load(bytes)

        const pages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        )

        pages.forEach((page) => {

          // 🔥 ADD PAGE NUMBER
          if (addPageNumbers) {
            const { width, height } = page.getSize()

            page.drawText(`${pageCount}`, {
              x: width - 40,
              y: 20,
              size: 10,
              font,
              color: rgb(0, 0, 0)
            })
          }

          mergedPdf.addPage(page)
          pageCount++
        })
      }

      const mergedBytes = await mergedPdf.save()

      const blob = new Blob([mergedBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      // 🔥 DOWNLOAD
      const a = document.createElement("a")
      a.href = url
      a.download = "merged.pdf"
      a.click()

      // 🔥 SAVE TO DATABASE
      await supabase.from("files").insert([
        {
          user_id: userData.user.id,
          name: "merged.pdf",
          type: "merge-pdf",
          file_url: url
        }
      ])

      URL.revokeObjectURL(url)

    } catch (err) {
      console.error(err)
      alert("Error ❌")
    }

    setLoading(false)
  }

  return (
    <main style={layout}>
      <h1>Merge PDF 🔥 (Pro)</h1>

      <input
        type="file"
        multiple
        accept="application/pdf"
        onChange={handleFiles}
      />

      {/* 🔥 TOGGLE PAGE NUMBER */}
      <label style={{fontSize:"14px"}}>
        <input
          type="checkbox"
          checked={addPageNumbers}
          onChange={()=>setAddPageNumbers(!addPageNumbers)}
        />
        Add Page Numbers
      </label>

      {/* 🔥 FILE LIST */}
      <div style={{width:"100%", maxWidth:"300px"}}>
        {files.map((f, i) => (
          <div key={i} style={fileBox}>
            <span style={{fontSize:"12px"}}>
              {i+1}. {f.name}
            </span>

            <div style={{display:"flex", gap:"5px"}}>
              <button onClick={()=>moveFile(i,-1)}>⬆️</button>
              <button onClick={()=>moveFile(i,1)}>⬇️</button>
              <button onClick={()=>removeFile(i)}>❌</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleMerge} style={btn}>
        {loading ? "Merging..." : "Merge PDFs"}
      </button>

    </main>
  )
}

// 🔥 STYLES

const layout = {
  display:"flex",
  flexDirection:"column",
  alignItems:"center",
  justifyContent:"center",
  minHeight:"100vh",
  gap:"20px",
  background:"#020617",
  color:"#fff",
  padding:"20px"
}

const btn = {
  padding:"12px 20px",
  background:"#22c55e",
  border:"none",
  borderRadius:"8px",
  color:"#000",
  fontWeight:"bold"
}

const fileBox = {
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  padding:"8px",
  marginBottom:"5px",
  background:"#111",
  borderRadius:"6px"
}
