import { NextResponse } from "next/server"

export async function POST(req) {

  const apiKey = process.env.CLOUDCONVERT_API_KEY

  try {

    // 🔥 GET TYPE FROM URL
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "pdf-to-word"

    // 🔥 DEFAULT (PDF → WORD)
    let inputFormat = "pdf"
    let outputFormat = "docx"
    let extraOptions = {}

    // 🔥 OTHER TOOLS
    if (type === "pdf-to-jpg") {
      inputFormat = "pdf"
      outputFormat = "jpg"
    }

    if (type === "jpg-to-pdf") {
      inputFormat = "jpg"
      outputFormat = "pdf"
    }

    if (type === "png-to-pdf") {
      inputFormat = "png"
      outputFormat = "pdf"
    }

    if (type === "pdf-to-png") {
      inputFormat = "pdf"
      outputFormat = "png"
    }

    // 🔥 WORD → PDF
    if (type === "word-to-pdf") {
      inputFormat = "docx"
      outputFormat = "pdf"
    }

    // 🔥 COMPRESS PDF
    if (type === "compress-pdf") {
      inputFormat = "pdf"
      outputFormat = "pdf"
      extraOptions = {
        engine: "qpdf",
        optimize_print: true
      }
    }

    // 🔥 IMAGE COMPRESS
    if (type === "image-compress") {
      inputFormat = "jpg"
      outputFormat = "jpg"
      extraOptions = {
        quality: 60
      }
    }

    // 🔥 CREATE JOB
    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tasks: {
          "import-my-file": {
            operation: "import/upload"
          },
          "convert-my-file": {
            operation: "convert",
            input: "import-my-file",
            input_format: inputFormat,
            output_format: outputFormat,
            ...extraOptions
          },
          "export-my-file": {
            operation: "export/url",
            input: "convert-my-file"
          }
        }
      })
    })

    const jobData = await jobRes.json()

    // 🔥 DEBUG RETURN
    if (!jobData?.data) {
      return NextResponse.json({ error: jobData }, { status: 500 })
    }

    const uploadTask = jobData.data.tasks.find(
      (t) => t.name === "import-my-file"
    )

    if (!uploadTask) {
      return NextResponse.json({
        error: "Upload task not found",
        full: jobData
      }, { status: 500 })
    }

    return NextResponse.json({
      uploadUrl: uploadTask.result.form.url,
      uploadParams: uploadTask.result.form.parameters,
      jobId: jobData.data.id
    })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
