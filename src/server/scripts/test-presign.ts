
import { Client } from "minio";

const client = new Client({
  endPoint: "localhost",
  port: 9000,
  useSSL: false,
  accessKey: "admin",
  secretKey: "Pranit#86!23",
});

async function main() {
  console.log("Attempting to generate presigned URL with unreachable host 'localhost'...");
  try {
    const url = await client.presignedPutObject("test-bucket", "test-object.jpg", 3600);
    console.log("Success! URL:", url);
  } catch (error) {
    console.error("Failed:", error);
  }
}

main();
