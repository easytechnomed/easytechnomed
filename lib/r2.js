import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  region: "auto",
  forcePathStyle: true,
});

export async function uploadFileToR2(fileBuffer, fileName, contentType, folder = "frame-templates") {
  const bucketName = process.env.R2_BUCKET_NAME || "pdf-store";
  const cleanFolder = (folder || "frame-templates").replace(/^\/+|\/+$/g, "");
  const cleanFileName = String(fileName || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${cleanFolder}/${Date.now()}-${cleanFileName}`;

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return { success: true, url: publicUrl, key };
  } catch (error) {
    console.error("R2 Upload Error:", error);
    return { success: false, error: error.message };
  }
}
