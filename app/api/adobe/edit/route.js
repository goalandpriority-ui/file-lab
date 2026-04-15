import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import {
  PDFServices,
  ServicePrincipalCredentials,
  MimeType
} from "@adobe/pdfservices-node-sdk"

export async function POST(req) {
  try {

    const data = await req.formData()
    const file = data.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 })
    }

    // 🔥 SAVE TEMP FILE
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const tempPath = path.join(process.cwd(), "temp.pdf")
    fs.writeFileSync(tempPath, buffer)

    // 🔥 ADOBE AUTH
    const credentials = new ServicePrincipalCredentials({
      clientId: process.env.ADOBE_CLIENT_ID,
      clientSecret: process.env.ADOBE_CLIENT_SECRET,
      organizationId: process.env.ADOBE_ORG_ID
    })

    const pdfServices = new PDFServices({ credentials })

    // 🔥 UPLOAD FILE
    const inputAsset = await pdfServices.upload({
      readStream: fs.createReadStream(tempPath),
      mimeType: MimeType.PDF
    })

    // 🔥 EXTRACT TEXT (REAL EDIT BASE)
    const extractResult = await pdfServices.extractPDF({
      asset: inputAsset,
      options: {
        elementsToExtract: ["text"]
      }
    })

    const resultAsset = extractResult.result.resource

    // 🔥 DOWNLOAD RESULT
    const stream = await pdfServices.getContent({ asset: resultAsset })

    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    const resultBuffer = Buffer.concat(chunks)

    return new Response(resultBuffer, {
      headers: {
        "Content-Type": "application/zip"
      }
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Adobe error" }, { status: 500 })
  }
}
