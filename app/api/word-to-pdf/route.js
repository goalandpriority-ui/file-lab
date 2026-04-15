import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")
    const buffer = await file.arrayBuffer()

    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/adobe-token`)
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    const uploadRes = await fetch("https://pdf-services.adobe.io/assets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": process.env.ADOBE_CLIENT_ID,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mediaType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      })
    })

    const uploadData = await uploadRes.json()

    await fetch(uploadData.uploadUri, {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      },
      body: buffer
    })

    const jobRes = await fetch("https://pdf-services.adobe.io/operation/createpdf", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": process.env.ADOBE_CLIENT_ID,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assetID: uploadData.assetID
      })
    })

    const jobData = await jobRes.json()

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
        "Content-Type": "application/pdf"
      }
    })

  } catch (err) {
    return NextResponse.json({ error: err.message })
  }
}
