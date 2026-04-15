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
       🔥 1. GET ACCESS TOKEN
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

    const tokenText = await tokenRes.text()
    const tokenData = tokenText ? JSON.parse(tokenText) : {}

    if (!tokenData.access_token) {
      return NextResponse.json({
        error: "❌ Token failed",
        tokenData
      })
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mediaType: "application/pdf"
      })
    })

    const uploadText = await uploadRes.text()
    const uploadData = uploadText ? JSON.parse(uploadText) : {}

    if (!uploadData.uploadUri) {
      return NextResponse.json({
        error: "❌ Upload init failed",
        uploadData
      })
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
      return NextResponse.json({
        error: "❌ File upload failed",
        status: putRes.status
      })
    }

    /* =========================
       🔥 4. CREATE JOB (FIXED ✅)
    ========================= */
    const jobRes = await fetch("https://pdf-services.adobe.io/operation/exportpdf", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": process.env.ADOBE_CLIENT_ID,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputAsset: {
          assetID: uploadData.assetID
        },
        outputFormat: "docx"
      })
    })

    const jobText = await jobRes.text()
    const jobData = jobText ? JSON.parse(jobText) : {}

    if (!jobData._links?.self?.href) {
      return NextResponse.json({
        error: "❌ Job creation failed",
        jobData
      })
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
          "x-api-key": process.env.ADOBE_CLIENT_ID
        }
      })

      const statusText = await statusRes.text()
      resultData = statusText ? JSON.parse(statusText) : {}

      console.log("Polling:", resultData.status)

      if (resultData.status === "done") break
    }

    /* =========================
       🔥 6. GET DOWNLOAD URL (FIXED ✅)
    ========================= */
    const downloadUrl = resultData?.outputs?.[0]?.asset?.downloadUri

    if (!downloadUrl) {
      return NextResponse.json({
        error: "❌ Conversion not ready",
        resultData
      })
    }

    /* =========================
       🔥 7. DOWNLOAD FILE
    ========================= */
    const fileRes = await fetch(downloadUrl)

    if (!fileRes.ok) {
      return NextResponse.json({
        error: "❌ Download failed"
      })
    }

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
