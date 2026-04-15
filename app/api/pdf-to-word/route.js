import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" })
    }

    const buffer = await file.arrayBuffer()

    /* =========================
       🔥 1. CREATE JOB
    ========================= */
    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}`,
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

    const jobData = await jobRes.json()

    if (!jobData.data) {
      return NextResponse.json({ error: "Job creation failed", jobData })
    }

    /* =========================
       🔥 2. UPLOAD FILE
    ========================= */
    const uploadTask = jobData.data.tasks.find(t => t.name === "import-file")

    const uploadRes = await fetch(uploadTask.result.form.url, {
      method: "POST",
      body: (() => {
        const form = new FormData()
        Object.entries(uploadTask.result.form.parameters).forEach(([k, v]) => {
          form.append(k, v)
        })
        form.append("file", new Blob([buffer]), file.name)
        return form
      })()
    })

    if (!uploadRes.ok) {
      return NextResponse.json({ error: "Upload failed" })
    }

    /* =========================
       🔥 3. WAIT FOR RESULT
    ========================= */
    let finishedJob

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const statusRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}`
        }
      })

      const statusData = await statusRes.json()

      if (statusData.data.status === "finished") {
        finishedJob = statusData.data
        break
      }
    }

    if (!finishedJob) {
      return NextResponse.json({ error: "Conversion timeout" })
    }

    /* =========================
       🔥 4. GET DOWNLOAD URL
    ========================= */
    const exportTask = finishedJob.tasks.find(t => t.name === "export-file")

    const downloadUrl = exportTask.result.files[0].url

    if (!downloadUrl) {
      return NextResponse.json({ error: "Download URL not found" })
    }

    /* =========================
       🔥 5. DOWNLOAD FILE
    ========================= */
    const fileRes = await fetch(downloadUrl)
    const fileBuffer = await fileRes.arrayBuffer()

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=converted.docx"
      }
    })

  } catch (err) {
    return NextResponse.json({
      error: "Server error",
      details: err.message
    })
  }
}
