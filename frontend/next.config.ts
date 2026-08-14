import type { NextConfig } from 'next';

/**
 * อนุญาตให้ next/image โหลดรูปเมนูจากโฮสต์ของ Backend
 *
 * ดึงโฮสต์มาจาก NEXT_PUBLIC_API_BASE_URL อัตโนมัติ จะได้ไม่ต้องแก้ไฟล์นี้ซ้ำ
 * ถ้า Backend เสิร์ฟรูปจากคนละโดเมนกับ API (เช่น S3 หรือ CDN) ให้เพิ่มเข้าไปใน extraImageHosts
 */
const extraImageHosts: string[] = [];

function buildRemotePatterns() {
  const origins = new Set<string>(extraImageHosts);

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (base) origins.add(base);

  return [...origins].flatMap((origin) => {
    try {
      const url = new URL(origin);
      const protocol = url.protocol === 'http:' ? ('http' as const) : ('https' as const);
      return [
        {
          protocol,
          hostname: url.hostname,
          ...(url.port ? { port: url.port } : {}),
        },
      ];
    } catch {
      console.warn('[next.config] ข้าม origin ที่ไม่ใช่ URL ที่ถูกต้อง:', origin);
      return [];
    }
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: buildRemotePatterns(),
  },
};

export default nextConfig;
