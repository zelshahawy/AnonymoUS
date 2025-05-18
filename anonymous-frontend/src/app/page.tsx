'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Secure Chat App</h1>
      <p className="mb-8 text-center max-w-lg">
        This is a simple real-time chat application built with Go, WebSockets, and MongoDB.
        Features secure, peer-to-peer messaging with history persistence.
      </p>
      <Link
        href="/login"
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Log In to Chat
      </Link>
    </div>
  );
}
