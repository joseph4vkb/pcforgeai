import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";
import { minioClient, minioPresigner, minioBaseUrl } from "~/server/minio";
import { randomBytes } from "crypto";

export const getMinioPresignedUrl = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      filename: z.string(),
      contentType: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("getMinioPresignedUrl called for:", input.filename);
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);

      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required. Only admins can upload images.",
        });
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    const bucketName = "blog-images";

    // Generate unique filename to prevent collisions
    const fileExtension = input.filename.split(".").pop() || "jpg";
    const uniqueId = randomBytes(16).toString("hex");
    const timestamp = Date.now();
    const objectName = `${timestamp}-${uniqueId}.${fileExtension}`;

    try {
      // Ensure bucket exists
      const bucketExists = await minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        console.log(`MinIO: Creating bucket "${bucketName}"...`);
        await minioClient.makeBucket(bucketName, "us-east-1"); // Use a default region
        // Set policy to allow public read access for the bucket
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

        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        console.log(`MinIO: Bucket "${bucketName}" created and policy set.`);
      }

      // Ensure CORS is set (idempotent-ish, or just force it to be safe)
      // Ensure CORS is set
      try {
        const corsConfig = {
          CORSRules: [
            {
              AllowedOrigins: ["*"],
              AllowedMethods: ["PUT", "GET", "POST", "HEAD"],
              AllowedHeaders: ["*"],
              ExposedHeaders: ["ETag"],
              MaxAgeSeconds: 3000,
            },
          ],
        };
        // @ts-ignore - method exists on client but might be missing in types
        await minioClient.setBucketCors(bucketName, corsConfig);
      } catch (e) {
        console.warn("MinIO: Failed to set CORS (might be already set or not supported):", e);
      }

      // Generate presigned URL for upload (expires in 1 hour)
      // Use minioPresigner which is configured with "localhost" so the signature matches
      // the hostname the browser will use.
      // Note: older minio SDKs take 3 args, some take 4. Content-Type is usually handled by client or header config.
      // We'll trust the presignedPutObject types here and remove the extra arg if it's complaining
      const presignedUrl = await minioPresigner.presignedPutObject(
        bucketName,
        objectName,
        60 * 60 // 1 hour
      );

      console.log("getMinioPresignedUrl: Generated presigned URL:", presignedUrl);

      // Construct the public URL that will be used to access the image
      // We still need to manually construct the public URL to point to localhost
      // since minioBaseUrl might be internal
      const publicUrl = `http://localhost:9000/${bucketName}/${objectName}`;

      return {
        uploadUrl: presignedUrl,
        publicUrl: publicUrl,
        objectName,
      };
    } catch (error: any) {
      console.error("MinIO presigned URL generation error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate upload URL",
        cause: error,
      });
    }
  });
