import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    S3_UPLOAD_BUCKET_NAME: process.env.S3_UPLOAD_BUCKET_NAME!,
    AWS_REGION: process.env.AWS_REGION!  
  },
};

export default nextConfig;