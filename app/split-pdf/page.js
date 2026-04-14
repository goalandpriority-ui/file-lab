"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import JSZip from "jszip"
import * as pdfjsLib from "pdfjs-dist"
import { supabase } from "@/lib/supabase"

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js"

export default function Page() {
  const [file, setFile] = useState(null)
  const [pages, setPages] = useState([])
  const [selected, setSelected] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  // 🔥 LOAD + THUMBNAIL
  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return

    setFile(f)

    const bytes = await f.arrayBuffer()

    const pdf = await PDFDocument.load(bytes)
    const total = pdf.getPageCount()
    const pageArr = Array.from({ length: total }, (_, i) => i)

    setPages(pageArr)
    setSelected(pageArr)

    const pdfjs = await pdfjsLib.getDocument({ data: bytes }).promise

    const imgs = []

    for (let i = 1; i <= pdfjs.numPages; i++) {
      const page = await pdfjs.getPage(i)
      const viewport = page.getViewport({ scale: 0.5 })

      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: context,
        viewport
      }).promise

      imgs.push(canvas.toDataURL())
    }

    setImages(imgs)
  }

  // 🔥 TOGGLE
  const togglePage = (index) => {
    if (selected.includes(index)) {
      setSelected(selected.filter(p => p !== index))
    } else {
      setSelected([...selected, index])
    }
  }

  // 🔥 REORDER
  const move = (i, dir) => {
    const arr = [...pages]
    const target = i + dir
    if (target < 0 || target >= arr.length) return

    ;[arr[i], arr[target]] = [arr[target], arr[i]]
    setPages(arr)
  }

  // 🔥 SPLIT
  const handleSplit = async () => {
    if (!file) return alert("Upload PDF")

    // 🔥 LOGIN CHECK
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      alert("Login required 🔐")
      window.location.href = "/login"
      return
    }

    setLoading(true)

    try {
      const bytes = await file.arrayBuffer()
      const pdf = await PDFDocument.load(bytes)

      const zip = new JSZip()

      for (let i of selected) {
        const newPdf = await PDFDocument.create()
        const [page] = await newPdf.copyPages(pdf, [i])
        newPdf.addPage(page)

        const bytes = await newPdf.save()
        zip.file(`page-${i+1}.pdf`, bytes)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)

      // 🔥 DOWNLOAD
      const a = document.createElement("a")
      a.href = url
      a.download = "split.zip"
      a.click()

      // 🔥 SAVE TO DATABASE
      await supabase.from("files").insert([
        {
          user_id: userData.user.id,
          name: "split.zip",
          type: "split-pdf",
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
      <h1>Split PDF 🔥 (Ultra Pro)</h1>

      <input type="file" accept="application/pdf" onChange={handleFile} />

      <div style={grid}>
        {pages.map((p, idx) => (
          <div key={p} style={box}>
            
            <img src={images[p]} style={{width:"100%"}} />

            <p>Page {p+1}</p>

            <button onClick={()=>togglePage(p)}>
              {selected.includes(p) ? "Selected" : "Select"}
            </button>

            <div>
              <button onClick={()=>move(idx,-1)}>⬆️</button>
              <button onClick={()=>move(idx,1)}>⬇️</button>
            </div>

          </div>
        ))}
      </div>

      <button onClick={handleSplit} style={btn}>
        {loading ? "Processing..." : "Download ZIP 🔥"}
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
  padding:"20px"
}

const grid = {
  display:"grid",
  gridTemplateColumns:"repeat(2,1fr)",
  gap:"10px"
}

const box = {
  padding:"10px",
  background:"#111",
  borderRadius:"8px"
}

const btn = {
  padding:"12px",
  background:"#22c55e",
  border:"none",
  borderRadius:"8px"
}
