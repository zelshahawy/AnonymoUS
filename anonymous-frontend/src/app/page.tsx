'use client';
import Footer from '@/components/footer';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Herobg from '../components/herobg';

export default function LandingPage() {
  return (
    <>
      <Herobg />
      <div className="relative min-h-screen flex flex-col">
        <div className="relative z-10 flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
            <div className="w-full max-w-5xl">
              {/* Header Section */}
              <div className="text-center mb-10">
                <h1 className="text-5xl font-bold text-[#f8f8f2] mb-3" >
                  Anonymous <span style={{ fontFamily: 'Georgia, serif italic' }}> for</span> Traders
                </h1>
                <p className="text-[28px] text-[#bd93f9] mb-6">
                  Real-time messaging with built-in stock data. Get live quotes instantly with bot commands.
                </p>
              </div>

              {/* Section Title */}
              <h2 className="text-3xl font-bold text-[#f8f8f2] mb-4">How it works</h2>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* How it Works Cards */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-[#44475a] p-4 rounded-lg border-2 border-[#bd93f9]">
                    <h3 className="text-lg font-bold text-[#50fa7b] mb-2">Add Contacts</h3>
                    <p className="text-sm text-[#f8f8f2]">Connect with other traders. Enter a username to start chatting anonymously.</p>
                  </div>

                  <div className="bg-[#44475a] p-4 rounded-lg border-2 border-[#bd93f9]">
                    <h3 className="text-lg font-bold text-[#50fa7b] mb-2">Use Bot Commands</h3>
                    <p className="text-sm text-[#f8f8f2]">Type / to access stock commands. Get real-time quotes and market data instantly in chat.</p>
                  </div>

                  <div className="bg-[#44475a] p-4 rounded-lg border-2 border-[#bd93f9]">
                    <h3 className="text-lg font-bold text-[#50fa7b] mb-2">Trade & Discuss</h3>
                    <p className="text-sm text-[#f8f8f2]">Share insights with your network. No central storage, no tracking. Your conversations stay private.</p>
                  </div>

                  <div className="bg-[#44475a] p-4 rounded-lg border-2 border-[#bd93f9]">
                    <h3 className="text-lg font-bold text-[#50fa7b] mb-2">Google Sign In</h3>
                    <p className="text-sm text-[#f8f8f2]">Sign in with your Google account for quick and secure access. No password needed.</p>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="flex flex-col gap-4">
                  <div className="bg-[#282a36] p-5 rounded-lg border border-[#6272a4] text-center">
                    <p className="text-sm text-[#f8f8f2] mb-2">Demo Credentials</p>
                    <p className="text-[#50fa7b] font-mono text-sm mb-1">testuser1</p>
                    <p className="text-[#50fa7b] font-mono text-sm">testpassword1</p>
                  </div>

                  <Link href="/login">
                    <button className="w-full px-4 py-3 bg-[#50fa7b] text-[#282a36] rounded-lg font-bold hover:bg-[#ff79c6] transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="w-full px-4 py-3 border-2 border-[#bd93f9] text-[#bd93f9] rounded-lg font-bold hover:bg-[#bd93f9] hover:text-[#282a36] transition-colors">
                      Register
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
