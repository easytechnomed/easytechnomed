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

export async function uploadFileToR2(fileBuffer, fileName, contentType) {
  const bucketName = process.env.R2_BUCKET_NAME || "pdf-store";
  const key = `frame-templates/${Date.now()}-${fileName}`;

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("R2 Upload Error:", error);
    return { success: false, error: error.message };
  }
}
