import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import fs from "fs";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: filePathArray } = await params;

        if (!filePathArray || filePathArray.length === 0) {
            return new NextResponse("File path is missing", { status: 400 });
        }

        const filePathStr = filePathArray.join("/");

        const isProd = process.env.NODE_ENV === "production";
        const absolutePath = isProd
            ? path.join(process.cwd(), "..", "storage", "uploads", filePathStr)
            : path.join(process.cwd(), "storage", "uploads", filePathStr);

        // Prevent directory traversal attacks
        const normalizedTarget = path.normalize(absolutePath);
        const normalizedUploadsRoot = isProd
            ? path.normalize(path.join(process.cwd(), "..", "storage", "uploads"))
            : path.normalize(path.join(process.cwd(), "storage", "uploads"));

        if (!normalizedTarget.startsWith(normalizedUploadsRoot)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (!fs.existsSync(absolutePath)) {
            return new NextResponse("File not found", { status: 404 });
        }

        const fileBuffer = await readFile(absolutePath);

        const ext = path.extname(absolutePath).toLowerCase();
        let contentType = "application/octet-stream";

        switch (ext) {
            case ".png":
                contentType = "image/png";
                break;
            case ".jpg":
            case ".jpeg":
                contentType = "image/jpeg";
                break;
            case ".pdf":
                contentType = "application/pdf";
                break;
            case ".svg":
                contentType = "image/svg+xml";
                break;
            case ".webp":
                contentType = "image/webp";
                break;
            case ".gif":
                contentType = "image/gif";
                break;
        }

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400", // Cache for 1 day
            },
        });
    } catch (error) {
        console.error("Error serving file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
