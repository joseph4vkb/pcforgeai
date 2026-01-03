import { Client } from "minio";
import { env } from "./env";
import { getBaseUrl } from "./utils/base-url";

// Allow overriding MinIO URL via environment variable (useful for Docker)
// process.env.MINIO_URL is used directly here to avoid strict validation if not added to env.ts yet,
// but ideally it should be added to env.ts.
const configuredMinioUrl = process.env.MINIO_URL || getBaseUrl({ port: 9000 });
export const minioBaseUrl = configuredMinioUrl;

// Parse the MinIO URL to extract hostname and port
const minioUrlWithoutProtocol = minioBaseUrl.split("://")[1]!;
const [minioHost, minioPortStr] = minioUrlWithoutProtocol.split(":");
const minioPort = minioPortStr ? parseInt(minioPortStr, 10) : (minioBaseUrl.startsWith("https://") ? 443 : 80);

export const minioClient = new Client({
  endPoint: minioHost!,
  port: minioPort,
  useSSL: minioBaseUrl.startsWith("https://"),
  accessKey: "admin",
  secretKey: env.ADMIN_PASSWORD,
});

// Client specifically for generating presigned URLs that will be used by the browser (localhost)
// This ensures the signature matches the hostname the browser uses
export const minioPresigner = new Client({
  endPoint: "localhost",
  port: 9000,
  useSSL: false,
  accessKey: "admin",
  secretKey: env.ADMIN_PASSWORD,
});
