import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = file.name.toLowerCase();

  try {
    let text = "";

    if (fileName.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse");
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const mammoth = await import("mammoth");
      const [rawResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ buffer }),
        mammoth.convertToHtml({ buffer }),
      ]);
      text = rawResult.value;
      return NextResponse.json({ text: text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(), html: htmlResult.value });
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or Word document." },
        { status: 400 }
      );
    }

    // Normalize whitespace
    text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract text from this file. Try a different format." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse the file. Make sure it's a valid PDF or Word document." },
      { status: 500 }
    );
  }
}
