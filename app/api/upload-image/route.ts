import { NextRequest, NextResponse } from "next/server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const client = new S3Client({
      region: process.env.AWS_API_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_API_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_API_SECRET_KEY!,
      },
    });

    const key = uuidv4();

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
      Key: key,
    });

    const presignedURL = await getSignedUrl(client, command, {
      expiresIn: 3600,
    });

    const uploadedURL = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return NextResponse.json({ presignedURL, uploadedURL });
  } catch (error) {
    console.log(error);
  }
}
