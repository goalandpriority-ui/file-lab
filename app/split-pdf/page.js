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
  const [range, setRange] = useState("")
  const [previewPages, setPreviewPages] = useState([])
  const [dragIndex, setDragIndex] = useState(null)

  // ✅ RANGE PARSER
  const parseRanges = (input) => {
    const parts = input.split(",").filter(Boolean)
    let result = []

    for (let part of parts) {
      if (part.includes("-")) {
        let [start, end] = part.split("-").map(Number)
        for (let i = start; i <= end; i++) {
          result.push(i - 1)
        }
      } else {
        result.push(Number(part) - 1)
      }
    }

    return [...new Set(result)]
  }

  // 🔥 LOAD PDF
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

      await page.render({ canvasContext: context, viewport }).promise
      imgs.push(canvas.toDataURL())
    }

    setImages(imgs)
  }

  const togglePage = (index) => {
    if (selected.includes(index)) {
      setSelected(selected.filter(p => p !== index))
    } else {
      setSelected([...selected, index])
    }
  }

  const move = (i, dir) => {
    const arr = [...pages]
    const target = i + dir
    if (target < 0 || target >= arr.length) return

    ;[arr[i], arr[target]] = [arr[target], arr[i]]
    setPages(arr)
  }

  const getFinalPages = () => {
    if (previewPages.length > 0) return previewPages

    let finalPages = selected

    if (range.trim() !== "") {
      finalPages = parseRanges(range)
    }

    return finalPages.sort((a, b) => a - b)
  }

  // 🔥 PREVIEW
  const handlePreview = () => {
    const finalPages = getFinalPages()
    setPreviewPages(finalPages)
  }

  // ❌ REMOVE
  const removePreviewPage = (index) => {
    setPreviewPages(previewPages.filter((_, i) => i !== index))
  }

  // 🧠 DRAG
  const handleDragStart = (index) => {
    setDragIndex(index)
  }

  const handleDrop = (index) => {
    if (dragIndex === null) return

    const updated = [...previewPages]
    const draggedItem = updated[dragIndex]

    updated.splice(dragIndex, 1)
    updated.splice(index, 0, draggedItem)

    setPreviewPages(updated)
    setDragIndex(null)
  }

  // 🔥 DOWNLOAD HELPER (FIX)
  const forceDownload = (url, filename) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename

    if (typeof a.download === "undefined") {
      window.open(url)
    } else {
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  // 🔥 ZIP
  const handleSplit = async () => {
    if (!file) return alert("Upload PDF 😤")

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

      const finalPages = getFinalPages()

      for (let i of finalPages) {
        if (i < 0 || i >= pdf.getPageCount()) continue

        const newPdf = await PDFDocument.create()
        const [page] = await newPdf.copyPages(pdf, [i])
        newPdf.addPage(page)

        const bytes = await newPdf.save()
        zip.file(`page-${i + 1}.pdf`, bytes)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)

      forceDownload(url, "split.zip")

      await supabase.from("files").insert([
        {
          user_id: userData.user.id,
          name: "split.zip",
          type: "split-pdf",
          file_url: url
        }
      ])

    } catch (err) {
      console.error(err)
      alert("Error ❌")
    }

    setLoading(false)
  }

  // 🔥 PDF
  const handleDownloadPDF = async () => {
    if (!file) return alert("Upload PDF 😤")

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

      const finalPages = getFinalPages()

      const newPdf = await PDFDocument.create()
      const copied = await newPdf.copyPages(pdf, finalPages)

      copied.forEach(p => newPdf.addPage(p))

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      forceDownload(url, "split.pdf")

      await supabase.from("files").insert([
        {
          user_id: userData.user.id,
          name: "split.pdf",
          type: "split-pdf",
          file_url: url
        }
      ])

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

      <input
        type="text"
        placeholder="Range: 1-3,5,8"
        value={range}
        onChange={(e) => setRange(e.target.value)}
        style={{ padding: "10px", borderRadius: "8px" }}
      />

      <div style={grid}>
        {pages.map((p, idx) => (
          <div key={p} style={box}>
            <img src={images[p]} style={{ width: "100%" }} />
            <p>Page {p + 1}</p>

            <button onClick={() => togglePage(p)}>
              {selected.includes(p) ? "Selected" : "Select"}
            </button>

            <div>
              <button onClick={() => move(idx, -1)}>⬆️</button>
              <button onClick={() => move(idx, 1)}>⬇️</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handlePreview} style={btn}>
        Preview Split 👀
      </button>

      {previewPages.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Preview (Drag + Remove):</h3>

          <div style={grid}>
            {previewPages.map((p, index) => (
              <div
                key={index}
                style={box}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
              >
                <img src={images[p]} style={{ width: "100%" }} />
                <p>Page {p + 1}</p>

                <button
                  onClick={() => removePreviewPage(index)}
                  style={{ background: "red", color: "#fff", marginTop: "5px" }}
                >
                  ❌ Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={handleSplit} style={btn}>
        {loading ? "Processing..." : "Download ZIP 🔥"}
      </button>

      <button onClick={handleDownloadPDF} style={btn}>
        Download PDF 📄
      </button>
    </main>
  )
}

const layout = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "20px",
  background: "#020617",
  color: "#fff",
  padding: "20px"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2,1fr)",
  gap: "10px"
}

const box = {
  padding: "10px",
  background: "#111",
  borderRadius: "8px"
}

const btn = {
  padding: "12px",
  background: "#22c55e",
  border: "none",
  borderRadius: "8px",
  marginTop: "10px"
        }
