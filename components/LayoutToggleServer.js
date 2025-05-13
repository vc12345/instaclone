"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LayoutToggleServer({ currentLayout, username }) {
  const searchParams = useSearchParams();
  const page = searchParams.get('page') || '1';
  
  return (
    <div className="flex items-center justify-end mb-4">
      <span className="text-sm text-gray-500 mr-2">Layout:</span>
      <div className="flex border border-gray-300 rounded-md overflow-hidden">
        <Link
          href={`/user/${username}?layout=single${page !== '1' ? `&page=${page}` : ''}`}
          className={`px-3 py-1.5 text-sm ${
            currentLayout === 'single'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Single column layout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </Link>
        <Link
          href={`/user/${username}?layout=grid${page !== '1' ? `&page=${page}` : ''}`}
          className={`px-3 py-1.5 text-sm ${
            currentLayout === 'grid'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Grid layout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}