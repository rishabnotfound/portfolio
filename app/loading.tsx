export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full"></div>
        <div className="w-20 h-20 border-4 border-blue-500 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
