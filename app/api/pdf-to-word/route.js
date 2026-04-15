import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" })
    }

    const buffer = await file.arrayBuffer()

    /* =========================
       🔥 1. GET TOKEN
    ========================= */
    const tokenRes = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", {
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

    const tokenData = JSON.parse(await tokenRes.text())

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "❌ Token failed", tokenData })
    }

    const accessToken = tokenData.access_token

    /* =========================
       🔥 2. CREATE ASSET
    ========================= */
    const uploadRes = await fetch("https://pdf-services.adobe.io/assets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": process.env.ADOBE_CLIENT_ID,
        "x-gw-ims-org-id": process.env.ADOBE_ORG_ID, // 🔥 IMPORTANT
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mediaType: "application/pdf"
      })
    })

    const uploadData = JSON.parse(await uploadRes.text())

    if (!uploadData.uploadUri) {
      return NextResponse.json({ error: "❌ Upload init failed", uploadData })
    }

    /* =========================
       🔥 3. UPLOAD FILE
    ========================= */
    const putRes = await fetch(uploadData.uploadUri, {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf"
      },
      body: buffer
    })

    if (!putRes.ok) {
      return NextResponse.json({ error: "❌ Upload failed" })
    }

    /* =========================
       🔥 4. CREATE JOB
    ========================= */
    const jobRes = await fetch("https://pdf-services.adobe.io/operation/exportpdf", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": process.env.ADOBE_CLIENT_ID,
        "x-gw-ims-org-id": process.env.ADOBE_ORG_ID, // 🔥 MUST
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: {
          assetID: uploadData.assetID
        },
        params: {
          targetFormat: "docx"
        }
      })
    })

    const jobData = JSON.parse(await jobRes.text())

    if (!jobData._links?.self?.href) {
      return NextResponse.json({ error: "❌ Job failed", jobData })
    }

    const statusUrl = jobData._links.self.href

    /* =========================
       🔥 5. POLLING
    ========================= */
    let resultData = null

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const statusRes = await fetch(statusUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-api-key": process.env.ADOBE_CLIENT_ID,
          "x-gw-ims-org-id": process.env.ADOBE_ORG_ID // 🔥 MUST
        }
      })

      resultData = JSON.parse(await statusRes.text())

      if (resultData.status === "done") break
    }

    /* =========================
       🔥 6. DOWNLOAD URL
    ========================= */
    const downloadUrl = resultData?.outputs?.[0]?.asset?.downloadUri

    if (!downloadUrl) {
      return NextResponse.json({
        error: "❌ Conversion failed",
        resultData
      })
    }

    /* =========================
       🔥 7. DOWNLOAD FILE
    ========================= */
    const fileRes = await fetch(downloadUrl)

    const fileBuffer = await fileRes.arrayBuffer()

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=converted.docx"
      }
    })

  } catch (err) {
    return NextResponse.json({
      error: "🔥 Server crash",
      details: err.message
    })
  }
}
