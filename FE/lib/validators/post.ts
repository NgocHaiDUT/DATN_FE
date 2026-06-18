const IMAGE_EXT_ALLOW = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".heif",
];
const MAX_IMAGES_MB = 10; // per file
const MAX_POST_CHARS = 5000;
const MAX_MEDIA_COUNT = 10;
const MAX_VIDEO_MINUTES = 5;

type FileLike = File | Blob;
type FileListLike = Array<FileLike> | FileList | undefined | null;

function getFileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.substring(idx).toLowerCase() : "";
}

export function validatePostContent(contentMd: string) {
  const content = typeof contentMd === "string" ? contentMd.trim() : "";
  if (content.length > MAX_POST_CHARS) {
    return { valid: false, error: `Nội dung tối đa ${MAX_POST_CHARS} ký tự` };
  }
  return { valid: true };
}

export function validateVisibility(visibility?: string) {
  if (!visibility) return { valid: true };
  const allow = ["public", "private", "friends"];
  if (!allow.includes(String(visibility))) {
    return {
      valid: false,
      error: "visibility phải là public | private | friends",
    };
  }
  return { valid: true };
}

export function validateMediaFiles(files?: FileListLike) {
  const errors: string[] = [];
  const fileList = Array.isArray(files)
    ? files
    : files
    ? Array.from(files)
    : [];
  if (fileList.length > MAX_MEDIA_COUNT) {
    errors.push(`Tối đa ${MAX_MEDIA_COUNT} media`);
  }
  fileList.forEach((file, index) => {
    const ext = getFileExt((file as File).name || "");
    const sizeMb = (file as File).size ? (file as File).size / (1024 * 1024) : 0;
    const type = (file as File).type || "";
    const isImage = type.startsWith("image/");
    const isVideo = type.startsWith("video/");
    if (!isImage && !isVideo) {
      errors.push(`File #${index + 1}: chỉ nhận ảnh hoặc video`);
      return;
    }
    if (isImage) {
      if (!IMAGE_EXT_ALLOW.includes(ext)) {
        errors.push(`Ảnh #${index + 1}: định dạng không hỗ trợ (${ext})`);
      }
      if (sizeMb > MAX_IMAGES_MB) {
        errors.push(`Ảnh #${index + 1}: kích thước > ${MAX_IMAGES_MB}MB`);
      }
    }
  });
  return { valid: errors.length === 0, errors };
}

export async function validateVideoDurations(files?: FileListLike) {
  const fileList = Array.isArray(files)
    ? files
    : files
    ? Array.from(files)
    : [];
  const errors: string[] = [];
  const checks = fileList.map((file, index) => {
    if (!file || !(((file as File).type || "").startsWith("video/")))
      return Promise.resolve();
    return new Promise<void>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      const url = URL.createObjectURL(file as Blob);
      const cleanup = () => {
        URL.revokeObjectURL(url);
      };
      video.onloadedmetadata = () => {
        const durationSec = video.duration || 0;
        const maxSec = MAX_VIDEO_MINUTES * 60;
        if (durationSec > maxSec) {
          errors.push(
            `Video #${index + 1}: thời lượng > ${MAX_VIDEO_MINUTES} phút`
          );
        }
        cleanup();
        resolve();
      };
      video.onerror = () => {
        errors.push(`Video #${index + 1}: không đọc được metadata`);
        cleanup();
        resolve();
      };
      video.src = url;
    });
  });
  await Promise.all(checks);
  return { valid: errors.length === 0, errors };
}

export function isEmptyPost(
  contentMd?: string,
  files?: FileListLike,
  mediaUrls?: string[],
) {
  const content = (contentMd || "").trim();
  const hasText = content.length > 0;
  const hasFiles =
    files &&
    (Array.isArray(files)
      ? files.length
      : (files as FileList).length || Array.from(files).length);
  const hasUrls = Array.isArray(mediaUrls) && mediaUrls.length > 0;
  return !hasText && !hasFiles && !hasUrls;
}

type BuildFormDataArgs = {
  content_md?: string;
  visibility?: string;
  title?: string;
  product_ids?: Array<string | number>;
  tags?: string[];
  files?: FileListLike;
};

export function buildCreatePostFormData({
  content_md,
  visibility,
  title,
  product_ids = [],
  tags = [],
  files = [],
}: BuildFormDataArgs) {
  const form = new FormData();
  if (content_md) form.append("content_md", content_md);
  if (visibility) form.append("visibility", String(visibility));
  if (title) form.append("title", title);
  (Array.isArray(product_ids) ? product_ids : []).forEach((id) =>
    form.append("product_ids[]", String(id))
  );
  (Array.isArray(tags) ? tags : []).forEach((t) =>
    form.append("tags[]", String(t))
  );
  (Array.isArray(files) ? files : Array.from(files || [])).forEach((file) =>
    form.append("media", file as Blob)
  );
  return form;
}

export const postValidationConstants = {
  MAX_POST_CHARS,
  MAX_MEDIA_COUNT,
  MAX_IMAGES_MB,
  MAX_VIDEO_MINUTES,
  IMAGE_EXT_ALLOW,
};
