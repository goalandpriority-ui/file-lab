import { NextResponse } from "next/server"

export async function POST() {

  const apiKey = process.env.CLOUDCONVERT_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 })
  }

  try {
    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tasks: {
          upload: {
            operation: "import/upload"
          },
          convert: {
            operation: "convert",
            input: "upload",
            input_format: "pdf",
            output_format: "docx"
          },
          export: {
            operation: "export/url",
            input: "convert"
          }
        }
      })
    })

    const jobData = await jobRes.json()

    if (!jobData?.data) {
      return NextResponse.json({ error: jobData }, { status: 500 })
    }

    const uploadTask = jobData.data.tasks.find(
      (t) => t.name === "upload"
    )

    return NextResponse.json({
      uploadUrl: uploadTask.result.form.url,
      uploadParams: uploadTask.result.form.parameters,
      jobId: jobData.data.id
    })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
