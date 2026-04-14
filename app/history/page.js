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

  // 🔥 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <main style={main}>

      {/* 🔥 HEADER */}
      <div style={header}>
        <h1>My Files 📂</h1>

        <div style={{textAlign:"right"}}>
          <p style={{fontSize:"12px", opacity:0.6}}>
            {user?.email}
          </p>

          <button onClick={logout} style={logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* 🔥 EMPTY */}
      {files.length === 0 && (
        <p style={{opacity:0.6, marginTop:"20px"}}>
          No files yet 😢 Convert something!
        </p>
      )}

      {/* 🔥 FILE LIST */}
      {files.map((f, i) => (
        <div key={i} style={card}>

          <div>
            <p style={{fontWeight:"bold"}}>{f.name}</p>
            <p style={{opacity:0.6, fontSize:"12px"}}>
              {f.type}
            </p>
          </div>

          <div style={{display:"flex", gap:"10px"}}>
            {f.file_url && (
              <a href={f.file_url} target="_blank" style={btn}>
                Open
              </a>
            )}
          </div>

        </div>
      ))}

    </main>
  )
}

// 🔥 STYLES

const main = {
  minHeight: "100vh",
  background: "#020617",
  color: "#fff",
  padding: "20px"
}

const header = {
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center"
}

const card = {
  padding: "14px",
  background: "#111",
  marginTop: "12px",
  borderRadius: "10px",
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center"
}

const btn = {
  padding:"6px 12px",
  background:"#22c55e",
  color:"#000",
  borderRadius:"6px",
  textDecoration:"none",
  fontSize:"12px",
  fontWeight:"bold"
}

const logoutBtn = {
  marginTop:"5px",
  padding:"6px 10px",
  background:"#ef4444",
  border:"none",
  borderRadius:"6px",
  color:"#fff",
  fontSize:"12px"
              }
