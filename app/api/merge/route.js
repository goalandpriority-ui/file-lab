import { NextResponse } from "next/server"

export async function POST() {

  const apiKey = process.env.CLOUDCONVERT_API_KEY

  const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tasks: {
        "import-files": {
          operation: "import/upload"
        },
        "merge-files": {
          operation: "merge",
          input: "import-files",
          output_format: "pdf"
        },
        "export-files": {
          operation: "export/url",
          input: "merge-files"
        }
      }
    })
  })

  const jobData = await jobRes.json()

  const uploadTask = jobData.data.tasks.find(
    (t) => t.name === "import-files"
  )

  return NextResponse.json({
    uploadUrl: uploadTask.result.form.url,
    uploadParams: uploadTask.result.form.parameters,
    jobId: jobData.data.id
  })
}
