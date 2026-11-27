"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function LoadingImage({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      {!loaded && !failed && (
        <Skeleton className="absolute inset-0 size-full" />
      )}
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ImageOff className="size-4" />
          圖片無法載入
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`${className} ${loaded ? "" : "opacity-0"}`}
        />
      )}
    </>
  );
}
export function ImageGallery({
  images,
  title,
  print = false,
}: {
  images: string[];
  title: string;
  print?: boolean;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const change = (direction: number) =>
    setIndex((i) =>
      i === null ? null : (i + direction + images.length) % images.length,
    );
  return (
    <>
      <div className="flex flex-wrap gap-3">
        {images.map((id, i) =>
          print ? (
            <img
              key={id}
              src={`/api/self/images/${id}`}
              alt={`${title} 附件 ${i + 1}`}
              loading="eager"
              className="h-28 w-28 rounded-lg border object-cover print:h-auto print:w-56 print:object-contain"
            />
          ) : (
            <button
              key={id}
              type="button"
              aria-label={`預覽 ${title} 附件 ${i + 1}`}
              onClick={() => setIndex(i)}
              className="relative size-28 cursor-pointer overflow-hidden rounded-lg border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LoadingImage
                src={`/api/self/images/${id}?size=thumbnail`}
                alt={`${title} 附件 ${i + 1}`}
                className="size-full object-cover"
              />
            </button>
          ),
        )}
      </div>
      <Dialog
        open={index !== null}
        onOpenChange={(open) => {
          if (!open) setIndex(null);
        }}
      >
        <DialogContent
          className="h-[90svh] max-w-[calc(100%-1rem)] grid-rows-[minmax(0,1fr)_auto] gap-0 overflow-hidden bg-black p-0 text-white sm:max-w-6xl"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              change(-1);
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              change(1);
            }
          }}
        >
          <DialogTitle className="sr-only">{title}圖片預覽</DialogTitle>
          <DialogDescription className="sr-only">
            使用左右方向鍵或按鈕切換照片，按 Escape 關閉。
          </DialogDescription>
          <div
            className="relative min-h-0"
            onTouchStart={(e) => {
              e.currentTarget.dataset.touchX = String(e.touches[0].clientX);
            }}
            onTouchEnd={(e) => {
              const start = Number(e.currentTarget.dataset.touchX);
              const delta = e.changedTouches[0].clientX - start;
              if (Math.abs(delta) > 60) change(delta > 0 ? -1 : 1);
            }}
          >
            {index !== null && (
              <LoadingImage
                key={images[index]}
                src={`/api/self/images/${images[index]}?size=preview`}
                alt={`${title} 附件 ${index + 1}`}
                eager
                className="size-full object-contain"
              />
            )}
            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="上一張圖片"
                  className="absolute top-1/2 left-3 rounded-full border-white/20 bg-black/60 text-white hover:bg-black/80"
                  onClick={() => change(-1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="下一張圖片"
                  className="absolute top-1/2 right-3 rounded-full border-white/20 bg-black/60 text-white hover:bg-black/80"
                  onClick={() => change(1)}
                >
                  <ChevronRight />
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/15 px-4 py-3">
            <span className="truncate">{title}</span>
            <span className="shrink-0 text-white/60">
              {(index ?? 0) + 1} / {images.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
