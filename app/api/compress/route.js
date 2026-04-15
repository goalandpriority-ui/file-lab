import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url)
    const level = searchParams.get("level") || "medium"

    const apiKey = process.env.CLOUDCONVERT_API_KEY

    // 🔥 LEVEL → PROFILE + DPI MAP
    let profile = "ebook"
    let dpi = 150

    if (level === "low") {
      profile = "prepress"   // high quality
      dpi = 300
    } 
    else if (level === "medium") {
      profile = "ebook"      // balanced
      dpi = 150
    } 
    else if (level === "high") {
      profile = "screen"     // max compression
      dpi = 72
    }

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

          // 🔥 FINAL PRO COMPRESSION
          "compress-file": {
            operation: "optimize",
            input: "import-file",
            engine: "ghostscript",
            profile: profile,
            flatten: true,
            dpi: dpi
          },

          "export-file": {
            operation: "export/url",
            input: "compress-file"
          }
        }
      })
    })

    const jobData = await jobRes.json()

    // 🔥 DEBUG (important for errors)
    if (!jobData?.data?.tasks) {
      console.error("CloudConvert Error:", jobData)
      return NextResponse.json(
        { error: "CloudConvert failed" },
        { status: 500 }
      )
    }

    const uploadTask = jobData.data.tasks.find(
      (t) => t.name === "import-file"
    )

    if (!uploadTask?.result?.form) {
      console.error("Upload Task Error:", uploadTask)
      return NextResponse.json(
        { error: "Upload task error" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      uploadUrl: uploadTask.result.form.url,
      uploadParams: uploadTask.result.form.parameters,
      jobId: jobData.data.id
    })

  } catch (err) {
    console.error("Compress API Error:", err)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
