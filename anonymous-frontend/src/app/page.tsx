'use client';
import Footer from '@/components/footer';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Herobg from '../components/herobg';

export default function LandingPage() {
  return (
    <>
      <Herobg />
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Image
          src="/chat-logo-1.png"
          alt="AnonymousME Logo"
          width={300}
          height={300}
          className="mb-10 rounded-full shadow-lg border-amber-500 bg-blue-100 hover:bg-blue-200 transition duration-300 transform hover:scale-105"
        />
        <h1 className="text-5xl font-extrabold text-white mb-4">
          AnonymoUS
        </h1>
        <p className="mb-8 text-center max-w-xl text-gray-200">
          AnonymoUS is a privacy-focused, real-time peer-to-peer chat app that aims for collaborative trading and stock market monitoring.
          No central storage of your messages, full end-to-end encryption, and seamless user experience.
        </p>
        <Link
          href="/login"
          className="px-10 py-4 bg-[#50fa7b] text-[#282a36] text-lg font-bold rounded-xl hover:bg-[#ff79c6] transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-[#50fa7b]/50"
        >
          Log In to Chat
        </Link>
      </div>
      <Footer />
    </>
  );
}
