import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url)
    const level = searchParams.get("level") || "medium"

    const apiKey = process.env.CLOUDCONVERT_API_KEY

    // 🔥 PRO LEVEL MAPPING (CORRECT)
    let profile = "ebook" // default

    if (level === "low") {
      profile = "prepress"   // 🔥 BEST QUALITY (least compression)
    } 
    else if (level === "medium") {
      profile = "ebook"      // 🔥 BALANCED
    } 
    else if (level === "high") {
      profile = "screen"     // 🔥 MAX COMPRESSION (small size)
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

          // 🔥 MAIN FIX HERE
          "compress-file": {
            operation: "optimize",
            input: "import-file",
            engine: "ghostscript",   // ✅ MUST
            profile: profile         // ✅ LEVEL BASED
          },

          "export-file": {
            operation: "export/url",
            input: "compress-file"
          }
        }
      })
    })

    const jobData = await jobRes.json()

    // 🔥 ERROR SAFETY
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
