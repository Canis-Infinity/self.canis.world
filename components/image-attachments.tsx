"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { LoadingImage } from "./image-gallery";
export type Attachment = {
  key: string;
  id?: string;
  file?: File;
  name: string;
};
function Photo({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!attachment.file) return;
    const value = URL.createObjectURL(attachment.file);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [attachment.file]);
  const src = attachment.id
    ? `/api/self/images/${attachment.id}?size=thumbnail`
    : url;
  return src ? (
    <LoadingImage
      key={src}
      src={src}
      alt={attachment.name}
      className="size-full object-cover"
    />
  ) : null;
}
export function ImageAttachments({
  value,
  onChange,
  disabled,
  onReject,
}: {
  value: Attachment[];
  onChange: (value: Attachment[]) => void;
  disabled: boolean;
  onReject: (message: string) => void;
}) {
  const files = value.flatMap((a) => (a.file ? [a.file] : []));
  const move = (index: number, direction: number) => {
    const next = [...value];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>照片（選填）</Label>
        <Badge variant="secondary">{value.length} 張</Badge>
      </div>
      <FileUpload
        value={files}
        onValueChange={(next) => {
          const kept = value.filter((a) => !a.file || next.includes(a.file));
          const added = next
            .filter((f) => !files.includes(f))
            .map((file) => ({
              key: crypto.randomUUID(),
              file,
              name: file.name,
            }));
          onChange([...kept, ...added]);
        }}
        accept="image/jpeg,image/png,image/webp"
        maxFiles={4 - value.filter((a) => a.id).length}
        maxSize={5 * 1024 * 1024}
        multiple
        disabled={disabled || value.length >= 4}
        onFileReject={(_, message) => onReject(message)}
      >
        {value.length ? (
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {value.map((a, i) => (
              <div
                key={a.key}
                className="min-w-0 overflow-hidden rounded-lg border bg-muted/20"
              >
                <div className="relative aspect-video bg-muted">
                  <Photo attachment={a} />
                  <Badge
                    variant="outline"
                    className="absolute top-2 left-2 bg-background/85"
                  >
                    {i + 1}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 border-t p-2">
                  <span
                    className="min-w-0 flex-1 truncate px-1 text-xs text-muted-foreground"
                    title={a.name}
                  >
                    {a.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`照片 ${i + 1} 往前移`}
                    disabled={disabled || i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`照片 ${i + 1} 往後移`}
                    disabled={disabled || i === value.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowRight />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`移除照片 ${i + 1}`}
                    disabled={disabled}
                    className="text-destructive"
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                  >
                    <X />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <FileUploadDropzone className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/15 p-6 text-center">
            <ImageIcon className="size-8 text-muted-foreground" />
            <span className="font-medium">新增第一張照片</span>
            <span className="text-sm text-muted-foreground">
              拖放照片，或點選下方按鈕。JPG、PNG、WebP，單張最多 5 MB。
            </span>
          </FileUploadDropzone>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <FileUploadTrigger
            render={<Button type="button" variant="outline" />}
          >
            <ImagePlus />
            {value.length ? "新增照片" : "選擇照片"}
          </FileUploadTrigger>
          <span className="text-sm text-muted-foreground">
            可一次選取多張，最多 4 張；上方順序會同步到紀錄。
          </span>
        </div>
      </FileUpload>
    </div>
  );
}
