import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url)

    const level = searchParams.get("level") || "medium"

    const apiKey = process.env.CLOUDCONVERT_API_KEY

    // 🔥 LEVEL → QUALITY MAP
    let quality = "screen" // default medium

    if (level === "low") quality = "ebook"      // high quality
    if (level === "medium") quality = "screen"  // balanced
    if (level === "high") quality = "printer"   // max compression

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
            profile: quality // 🔥 IMPORTANT CHANGE
          },
          "export-file": {
            operation: "export/url",
            input: "compress-file"
          }
        }
      })
    })

    const jobData = await jobRes.json()

    if (!jobData?.data) {
      return NextResponse.json(
        { error: "CloudConvert error" },
        { status: 500 }
      )
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
    console.error("Compress API Error:", err)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
