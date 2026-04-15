import { NextResponse } from "next/server"

export async function POST(req) {
  const formData = await req.formData()
  const file = formData.get("file")

  const buffer = Buffer.from(await file.arrayBuffer())

  // 🔥 TEMP: fake response (test)
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
  })
}
