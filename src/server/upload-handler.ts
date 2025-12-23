
import { defineEventHandler, readMultipartFormData, getHeader } from "vinxi/http";
import { minioClient } from "./minio";
import { env } from "./env";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { randomBytes } from "crypto";

export default defineEventHandler(async (event) => {
  // 1. Verify Authentication
  const authHeader = getHeader(event, "Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return new Response(JSON.stringify({ error: "Invalid token format" }), { status: 401 });
  }
  try {
    const verified = jwt.verify(token, env.JWT_SECRET);
    const parsed = z.object({ role: z.enum(["admin", "user"]) }).parse(verified);
    if (parsed.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), { status: 403 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
  }

  // 2. Parse Multipart Form Data
  const files = await readMultipartFormData(event);
  if (!files || files.length === 0) {
    return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
  }

  const file = files[0];
  if (!file) {
    return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
  }
  if (!file.filename || !file.type || !file.type.startsWith("image/")) {
    return new Response(JSON.stringify({ error: "Invalid file type. Only images are allowed." }), { status: 400 });
  }

  // 3. Generate Filename & Upload to MinIO
  const bucketName = "blog-images";
  const fileExtension = file.filename.split(".").pop() || "jpg";
  const uniqueId = randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const objectName = `${timestamp}-${uniqueId}.${fileExtension}`;

  try {
    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, "us-east-1");
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetBucketLocation", "s3:ListBucket"],
            Resource: [`arn:aws:s3:::${bucketName}`],
          },
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    }

    // Upload Buffer directly
    await minioClient.putObject(bucketName, objectName, file.data, file.data.length, {
      "Content-Type": file.type,
    });

    // 4. Construct Public URL
    // Use the logic from base-url.ts dynamically if possible, or build it manually based on request host
    // Since this is S2S, we just need to return the URL that validly points to the ingress/nginx
    // In production, users access via the domain.
    // We can assume Nginx proxies /minio-images/* to MinIO? No, typically MinIO exposes its own ports or we use presigned URLs.
    // Wait, the previous implementation used `http://localhost:9000/...`.
    // The previous implementation constructed: `http://localhost:9000/blog-images/filename`
    // We should replicate that or improve it.
    // Ideally, we return a relative URL if we are proxying, but we aren't proxying retrieval, only upload.
    // Retrieval is done directly from MinIO (or Nginx proxying MinIO).
    // If the previous code returned `http://localhost:9000/...`, then retrieval assumes direct access to MinIO port.
    // Let's stick to that for now to avoid breaking retrieval, but we should probably use `minioBaseUrl` if it was public.
    // However, `minioBaseUrl` in server context is internal `http://minio:9000`.
    // We need the PUBLIC MinIO URL.
    // For now, hardcoding `http://localhost:9000` (or `window.location.hostname`) logic on client is what was happening.
    // But here we return the URL.
    // Let's return the internal URL and let the client fix it? Or better, return the relative path and let client append?
    // Actually, looking at `getMinioPresignedUrl.ts`:
    // const publicUrl = `http://localhost:9000/${bucketName}/${objectName}`;
    // So I will return exactly that to be consistent.

    const publicUrl = `http://localhost:9000/${bucketName}/${objectName}`;

    return new Response(JSON.stringify({
      success: true,
      imageUrl: publicUrl,
      objectName
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: "Failed to upload to storage", details: error.message }), { status: 500 });
  }
});
