"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Login() {

  const [loading, setLoading] = useState(false)

  // 🔥 AUTO REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()

    if (data?.user) {
      window.location.href = "/"
    }
  }

  // 🔥 GOOGLE LOGIN
  const loginWithGoogle = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) {
      alert("Login failed ❌")
      setLoading(false)
    }
  }

  return (
    <main style={main}>
      
      <h1 style={title}>Welcome to FileLab</h1>
      <p style={subtitle}>Login to save your files 🚀</p>

      <button 
        onClick={loginWithGoogle} 
        style={btn}
        disabled={loading}
      >
        {loading ? "Redirecting..." : "Continue with Google"}
      </button>

    </main>
  )
}

// 🔥 STYLES

const main = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#020617",
  color: "#fff",
  gap: "15px",
  padding: "20px"
}

const title = {
  fontSize: "26px",
  fontWeight: "700"
}

const subtitle = {
  opacity: 0.6,
  fontSize: "14px"
}

const btn = {
  padding: "14px 24px",
  background: "linear-gradient(145deg,#22c55e,#16a34a)",
  border: "none",
  borderRadius: "12px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 6px 20px rgba(34,197,94,0.3)"
          }
