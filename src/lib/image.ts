// 將使用者選擇的圖片縮小並轉為 JPEG dataURL：控制 AI 視覺 API 的合理大小，
// 並處理 EXIF 方向（手機直拍）。
export async function fileToDataUrl(
  file: File,
  maxEdge = 1600,
  quality = 0.85
): Promise<string> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if ("close" in bitmap) bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

async function loadBitmap(
  file: File
): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // 不支援 imageOrientation 選項的瀏覽器
  }
  try {
    return await createImageBitmap(file);
  } catch {
    // 不支援 createImageBitmap：改用 <img>（繪製時會自動套用 EXIF 方向）
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image-unreadable"));
    };
    img.src = url;
  });
}
