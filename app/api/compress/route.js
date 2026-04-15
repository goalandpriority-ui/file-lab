import { NextResponse } from "next/server"

export async function POST(req) {
  const apiKey = process.env.CLOUDCONVERT_API_KEY

  const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
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
        "compress-file": {
          operation: "optimize",
          input: "import-file",
          engine: "qpdf"
        },
        "export-file": {
          operation: "export/url",
          input: "compress-file"
        }
      }
    })
  })

  const jobData = await jobRes.json()

  const uploadTask = jobData.data.tasks.find(
    (t) => t.name === "import-file"
  )

  return NextResponse.json({
    uploadUrl: uploadTask.result.form.url,
    uploadParams: uploadTask.result.form.parameters,
    jobId: jobData.data.id
  })
}
