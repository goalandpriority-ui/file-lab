import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const data = await req.formData()
  const file = data.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "No file" })
  }

  const apiKey = process.env.CLOUDCONVERT_API_KEY!

  const res = await fetch("https://api.cloudconvert.com/v2/jobs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tasks: {
        "import-file": {
          operation: "import/upload"
        },
        "convert-file": {
          operation: "convert",
          input: "import-file",
          input_format: "pdf",
          output_format: "docx"
        },
        "export-file": {
          operation: "export/url",
          input: "convert-file"
        }
      }
    })
  })

  const json = await res.json()
  return NextResponse.json(json)
}
