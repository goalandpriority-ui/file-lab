import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")
    const buffer = await file.arrayBuffer()

    // 🔥 1. GET ACCESS TOKEN (DIRECT - NO INTERNAL API)
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

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Token failed", tokenData })
    }

    const accessToken = tokenData.access_token

    // 🔥 2. CREATE ASSET (UPLOAD INIT)
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

    const uploadData = await uploadRes.json()

    if (!uploadData.uploadUri) {
      return NextResponse.json({ error: "Upload init failed", uploadData })
    }

    // 🔥 3. UPLOAD FILE
    await fetch(uploadData.uploadUri, {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf"
      },
      body: buffer
    })

    // 🔥 4. CREATE EXPORT JOB
    const jobRes = await fetch("https://pdf-services.adobe.io/operation/exportpdf", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": process.env.ADOBE_CLIENT_ID,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assetID: uploadData.assetID,
        targetFormat: "docx"
      })
    })

    const jobData = await jobRes.json()

    if (!jobData._links?.self?.href) {
      return NextResponse.json({ error: "Job creation failed", jobData })
    }

    const statusUrl = jobData._links.self.href

    // 🔥 5. POLLING (IMPORTANT FIX)
    let resultData = null

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000)) // wait 2 sec

      const statusRes = await fetch(statusUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-api-key": process.env.ADOBE_CLIENT_ID
        }
      })

      resultData = await statusRes.json()

      if (resultData.status === "done") break
    }

    if (!resultData?.asset?.downloadUri) {
      return NextResponse.json({ error: "Conversion not ready", resultData })
    }

    // 🔥 6. DOWNLOAD RESULT
    const fileRes = await fetch(resultData.asset.downloadUri)
    const fileBuffer = await fileRes.arrayBuffer()

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    })

  } catch (err) {
    return NextResponse.json({ error: err.message })
  }
}
