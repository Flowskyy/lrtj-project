import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount?: number;
  pageSize?: number;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize = 50,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startRecord = ((currentPage - 1) * pageSize) + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount || currentPage * pageSize);

  return (
    <div className={`flex items-center justify-between mt-4 ${className}`}>
      <div className="text-xs text-gray-500">
        {totalCount ? (
          <span>Showing {startRecord} to {endRecord} of {totalCount} records</span>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="min-h-[36px]"
        >
          Previous
        </Button>
        <span className="text-xs text-gray-600 px-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="min-h-[36px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
