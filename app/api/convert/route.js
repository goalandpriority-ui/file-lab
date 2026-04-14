import { NextResponse } from "next/server"

export async function POST() {

  const apiKey = process.env.CLOUDCONVERT_API_KEY

  try {
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
            input_format: "pdf",
            output_format: "docx"
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
