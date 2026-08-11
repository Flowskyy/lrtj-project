export default function TablePageLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Card Skeleton */}
      <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
