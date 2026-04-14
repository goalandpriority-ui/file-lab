"use client"

import { useState } from "react"

export default function Page() {
  const [text, setText] = useState("")

  return (
    <main style={{
      display:"flex",
      flexDirection:"column",
      padding:"20px",
      background:"#020617",
      color:"#fff",
      minHeight:"100vh",
      gap:"20px"
    }}>

      <h1>Word Editor</h1>

      <textarea
        value={text}
        onChange={(e)=>setText(e.target.value)}
        placeholder="Start typing..."
        style={{
          width:"100%",
          height:"300px",
          padding:"10px",
          borderRadius:"8px"
        }}
      />

      <button
        onClick={()=>{
          const blob = new Blob([text], { type: "text/plain" })
          const url = URL.createObjectURL(blob)

          const a = document.createElement("a")
          a.href = url
          a.download = "document.txt"
          a.click()
        }}
        style={{
          padding:"10px",
          background:"#22c55e",
          border:"none",
          borderRadius:"8px"
        }}
      >
        Download File
      </button>

    </main>
  )
}
