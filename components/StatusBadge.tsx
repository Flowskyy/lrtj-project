import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { className: string }> = {
  completed: {
    className: "bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px]",
  },
  approved: {
    className: "bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px]",
  },
  rejected: {
    className: "bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 text-[10px]",
  },
  cancelled: {
    className: "bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 text-[10px]",
  },
  process: {
    className: "bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100 text-[10px]",
  },
  pending: {
    className: "bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100 text-[10px]",
  },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusLower = status.toLowerCase();
  const config = statusConfig[statusLower] || {
    className: "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px]",
  };

  return (
    <Badge variant="secondary" className={`${config.className} ${className}`}>
      {status}
    </Badge>
  );
}
