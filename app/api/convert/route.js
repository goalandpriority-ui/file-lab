import { NextResponse } from "next/server"

export async function POST(req) {
  const data = await req.formData()
  const file = data.get("file")

  if (!file) {
    return NextResponse.json({ error: "No file" })
  }

  const apiKey = process.env.CLOUDCONVERT_API_KEY

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

  const uploadTask = jobData.data.tasks.find(t => t.name === "upload")

  const uploadUrl = uploadTask.result.form.url
  const uploadParams = uploadTask.result.form.parameters

  const uploadForm = new FormData()

  Object.keys(uploadParams).forEach((key) => {
    uploadForm.append(key, uploadParams[key])
  })

  uploadForm.append("file", file)

  await fetch(uploadUrl, {
    method: "POST",
    body: uploadForm
  })

  let exportUrl = null

  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000))

    const check = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    const checkData = await check.json()

    const exportTask = checkData.data.tasks.find(t => t.name === "export")

    if (exportTask && exportTask.status === "finished") {
      exportUrl = exportTask.result.files[0].url
      break
    }
  }

  return NextResponse.json({ url: exportUrl })
}
