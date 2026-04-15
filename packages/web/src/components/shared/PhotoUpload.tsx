import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PhotoUploadProps {
  onChange: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

export function PhotoUpload({ onChange, maxFiles = 5, className }: PhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = maxFiles - previews.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews = toAdd.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updated = [...previews, ...newPreviews];
    setPreviews(updated);
    onChange(updated.map(p => p.file));

    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeFile(index: number) {
    const updated = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index].url);
    setPreviews(updated);
    onChange(updated.map(p => p.file));
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Thumbnails */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((p, i) => (
            <div key={p.url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => removeFile(i)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Camera button */}
      {previews.length < maxFiles && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          <Camera className="h-5 w-5" />
          Add Photo
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}
