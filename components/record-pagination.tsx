"use client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
export function RecordPagination({
  page,
  pages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (!total) return null;
  const numbers = [...new Set([1, page - 1, page, page + 1, pages])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  const props = (target: number) => ({
    href: `?page=${target}`,
    onClick: (event: React.MouseEvent) => {
      event.preventDefault();
      if (target >= 1 && target <= pages && target !== page) onChange(target);
    },
  });
  return (
    <div className="space-y-3 print:hidden">
      <p className="text-center text-sm text-muted-foreground">
        第 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} 筆，共{" "}
        {total} 筆
      </p>
      {pages > 1 && (
        <Pagination aria-label="紀錄分頁">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                {...props(page - 1)}
                text="上一頁"
                aria-label="上一頁"
                aria-disabled={page === 1}
                tabIndex={page === 1 ? -1 : undefined}
                className={page === 1 ? "pointer-events-none opacity-40" : ""}
              />
            </PaginationItem>
            {numbers.map((number, index) => (
              <PaginationItem key={number} className="flex items-center">
                {index > 0 && number - numbers[index - 1] > 1 && (
                  <PaginationEllipsis />
                )}
                <PaginationLink
                  {...props(number)}
                  isActive={page === number}
                  aria-label={`第 ${number} 頁`}
                >
                  {number}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                {...props(page + 1)}
                text="下一頁"
                aria-label="下一頁"
                aria-disabled={page === pages}
                tabIndex={page === pages ? -1 : undefined}
                className={
                  page === pages ? "pointer-events-none opacity-40" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
