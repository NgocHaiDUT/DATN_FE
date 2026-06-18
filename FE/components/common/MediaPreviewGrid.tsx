import { useCallback } from "react";

interface MediaPreviewGridProps {
  files?: File[];
  onRemove?: (idx: number) => void;
  onReorder?: (from: number, to: number) => void;
}

export default function MediaPreviewGrid({
  files = [],
  onRemove,
  onReorder,
}: MediaPreviewGridProps) {
  const handleRemove = useCallback(
    (idx: number) => {
      onRemove?.(idx);
    },
    [onRemove],
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      onReorder?.(from, to);
    },
    [onReorder],
  );

  if (!files || files.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {files.map((file: File, idx: number) => {
        const isImage = (file.type || "").startsWith("image/");
        const url = URL.createObjectURL(file);
        return (
          <div key={idx} className="relative border rounded overflow-hidden">
            {isImage ? (
              <img
                src={url}
                alt={file.name}
                className="w-full h-28 object-cover"
                onLoad={() => URL.revokeObjectURL(url)}
              />
            ) : (
              <video
                src={url}
                className="w-full h-28 object-cover"
                controls
                onLoadedData={() => URL.revokeObjectURL(url)}
              />
            )}
            <div className="absolute top-1 right-1 flex gap-1">
              <button
                type="button"
                className="px-2 py-1 text-xs bg-white/80 rounded"
                onClick={() => move(idx, Math.max(0, idx - 1))}
              >
                ↑
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs bg-white/80 rounded"
                onClick={() => move(idx, Math.min(files.length - 1, idx + 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                onClick={() => handleRemove(idx)}
              >
                x
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}