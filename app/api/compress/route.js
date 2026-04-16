import { NextResponse } from "next/server"

export async function POST(req) {
  try {
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
            engine: "ghostscript",

            // 🔥 VERY STRONG SETTINGS
            profile: "screen",
            dpi: 50,
            flatten: true,
            strip: true
          },

          "export-file": {
            operation: "export/url",
            input: "compress-file"
          }
        }
      })
    })

    const jobData = await jobRes.json()

    if (!jobData?.data?.tasks) {
      console.error(jobData)
      return NextResponse.json({ error: "Failed" }, { status: 500 })
    }

    const uploadTask = jobData.data.tasks.find(
      (t) => t.name === "import-file"
    )

    return NextResponse.json({
      uploadUrl: uploadTask.result.form.url,
      uploadParams: uploadTask.result.form.parameters,
      jobId: jobData.data.id
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
