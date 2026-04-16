import { NextResponse } from "next/server"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get("jobId")

  const apiKey = process.env.CLOUDCONVERT_API_KEY

  try {
    const res = await fetch(
      `https://api.cloudconvert.com/v2/jobs/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    const data = await res.json()

    // 🔥 DEBUG LOG
    console.log(JSON.stringify(data, null, 2))

    const exportTask = data.data.tasks.find(
      (t) => t.name === "export-file"
    )

    // ❌ FAILED CASE
    if (exportTask?.status === "error") {
      return NextResponse.json({ error: true })
    }

    // ✅ SUCCESS
    if (exportTask?.status === "finished") {
      return NextResponse.json({
        done: true,
        url: exportTask.result.files[0].url
      })
    }

    return NextResponse.json({ done: false })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: true }, { status: 500 })
  }
}
