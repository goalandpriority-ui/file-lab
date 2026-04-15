import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")
    const buffer = await file.arrayBuffer()

    // 🔥 1. GET TOKEN
    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/adobe-token`)
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // 🔥 2. UPLOAD FILE
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

    await fetch(uploadData.uploadUri, {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf"
      },
      body: buffer
    })

    // 🔥 3. CREATE JOB
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

    // 🔥 4. GET RESULT
    const resultRes = await fetch(jobData._links.self.href, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": process.env.ADOBE_CLIENT_ID
      }
    })

    const resultData = await resultRes.json()

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
