"use client"

import { supabase } from "@/lib/supabase"

export default function Login() {

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    })
  }

  return (
    <main style={main}>
      <h1 style={title}>Login 🔐</h1>

      <button onClick={loginWithGoogle} style={btn}>
        Continue with Google 🚀
      </button>
    </main>
  )
}

const main = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#020617",
  color: "#fff",
  gap: "20px"
}

const title = {
  fontSize: "28px"
}

const btn = {
  padding: "14px 24px",
  background: "#22c55e",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold"
}
