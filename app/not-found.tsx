import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <p className="text-xl text-gray-300 mb-8">Page not found</p>
        <Link
          href="/"
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full font-semibold hover:scale-105 transition-all inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
