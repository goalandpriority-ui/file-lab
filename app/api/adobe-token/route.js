import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.ADOBE_CLIENT_ID,
        client_secret: process.env.ADOBE_CLIENT_SECRET,
        scope: "openid,AdobeID,DCAPI"
      })
    })

    const data = await res.json()

    return NextResponse.json(data)

  } catch (err) {
    return NextResponse.json({ error: err.message })
  }
}
