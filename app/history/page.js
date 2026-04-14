"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function History() {

  const [files, setFiles] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      window.location.href = "/login"
      return
    }

    setUser(data.user)
    fetchFiles(data.user.id)
  }

  const fetchFiles = async (userId) => {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (!error) setFiles(data)
  }

  return (
    <main style={main}>
      <h1>My Files 📂</h1>

      {files.length === 0 && <p>No files yet 😢</p>}

      {files.map((f, i) => (
        <div key={i} style={card}>
          <p>{f.name}</p>
          <p style={{opacity:0.6}}>{f.type}</p>
        </div>
      ))}
    </main>
  )
}

const main = {
  minHeight: "100vh",
  background: "#020617",
  color: "#fff",
  padding: "20px"
}

const card = {
  padding: "12px",
  background: "#111",
  marginTop: "10px",
  borderRadius: "8px"
}
