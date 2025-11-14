import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { File as FormidableFile } from "formidable";

interface s3MethodReturnObj {
  success: boolean;
  fileKey?: string;
  s3Url?: string;
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// Upload File to S3
export const uploadFile = async (
  bucketName: string,
  file: FormidableFile
): Promise<s3MethodReturnObj> => {
  try {
    const fileStream = fs.createReadStream(file.filepath);
    const originalName = file.originalFilename || "upload";
    const contentType = file.mimetype || "application/octet-stream";
    const fileKey = `${uuidv4()}-${originalName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: fileStream,
        ContentType: contentType,
        //ACL: "public-read",
      })
    );
    return {
      success: true,
      fileKey: fileKey,
      s3Url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
    };
  }
};

// Delete File from S3
export const deleteFile = async (
  bucketName: string,
  fileKey: string
): Promise<s3MethodReturnObj> => {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      })
    );
    return {
      success: true,
      fileKey: fileKey,
    };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
};

// Edit existing file in S3
export const editFile = async (
  bucketName: string,
  oldFileKey: string,
  newFile: FormidableFile
): Promise<s3MethodReturnObj> => {
  try {
    const deleteFileRes = await deleteFile(bucketName, oldFileKey);
    if (!deleteFileRes) throw Error("failed");
    const uploadFileRes = await uploadFile(bucketName, newFile);

    if (!uploadFileRes) throw Error("failed");
    return uploadFileRes; // S3 file url
  } catch (e) {
    console.error(e);
    return { success: false };
  }
};

export const uploadProfileImg = (file: FormidableFile) => {
  return uploadFile(process.env.AWS_S3_PROFILE_IMG_BUCKET!, file);
};

export const deleteProfileImg = (fileKey: string) => {
  return deleteFile(process.env.AWS_S3_PROFILE_IMG_BUCKET!, fileKey);
};

export const editProfileImg = (oldFileKey: string, newFile: FormidableFile) => {
  return editFile(process.env.AWS_S3_PROFILE_IMG_BUCKET!, oldFileKey, newFile);
};

// upload images or video
export const uploadContents = (file: FormidableFile) => {
  return uploadFile(process.env.AWS_S3_CONTENTS_BUCKET!, file);
};

export const deleteContents = (fileKey: string) => {
  return deleteFile(process.env.AWS_S3_CONTENTS_BUCKET!, fileKey);
};
