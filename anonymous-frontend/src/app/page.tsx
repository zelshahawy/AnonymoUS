'use client';
import Footer from '@/components/footer';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Herobg from '../components/herobg';

// Simple chevron down SVG component
const ChevronDownIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function LandingPage() {
  const scrollToDetails = () => {
    document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Herobg />
      <div className="relative min-h-screen">
        <div className="relative z-10">
          <Navbar />
          <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
            <Image
              src="/chat-logo-1.png"
              alt="AnonymousME Logo"
              width={300}
              height={300}
              className="mb-10 rounded-full shadow-lg border-amber-500 bg-blue-100 hover:bg-[#bd93f9] transition duration-300 transform hover:scale-105"
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

            {/* Scroll Arrow */}
            <button
              onClick={scrollToDetails}
              className="absolute bottom-8 animate-bounce"
            >
              <ChevronDownIcon className="w-12 h-12 text-white/70 hover:text-white transition-colors cursor-pointer" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div id="details" className="min-h-screen py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-[#bd93f9]">
            Why Choose AnonymoUS?
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Privacy & Security */}
            <div className="bg-[#44475a] p-8 rounded-lg border-2 border-[#bd93f9] shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-[#50fa7b]">🔒 Privacy First</h3>
              <p className="text-[#f8f8f2] leading-relaxed">
                Your conversations are private and secure. We do not store unnecessary data,
                and your messages are protected with industry-standard security measures.
              </p>
            </div>

            {/* Real-time Messaging */}
            <div className="bg-[#44475a] p-8 rounded-lg border-2 border-[#bd93f9] shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-[#50fa7b]">💬 Instant Messaging</h3>
              <p className="text-[#f8f8f2] leading-relaxed">
                Real-time WebSocket connections ensure your messages are delivered instantly.
                No delays, no refresh needed - just seamless communication.
              </p>
            </div>

            {/* Google Authentication */}
            <div className="bg-[#44475a] p-8 rounded-lg border-2 border-[#bd93f9] shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-[#50fa7b]">🔐 Secure Login</h3>
              <p className="text-[#f8f8f2] leading-relaxed">
                Sign in securely with your Google account. No need to remember another password -
                we use OAuth 2.0 for safe and simple authentication.
              </p>
            </div>

            {/* Stock Monitoring */}
            <div className="bg-[#44475a] p-8 rounded-lg border-2 border-[#bd93f9] shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-[#50fa7b]">📈 Stock Bot</h3>
              <p className="text-[#f8f8f2] leading-relaxed">
                Get real-time stock quotes directly in your chat! Just type a stock command
                and our bot will provide current market data instantly.
              </p>
            </div>

            {/* Anonymous */}
            <div className="bg-[#44475a] p-8 rounded-lg border-2 border-[#bd93f9] shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-[#50fa7b]">👤 Stay Anonymous</h3>
              <p className="text-[#f8f8f2] leading-relaxed">
                Choose your own username and chat without revealing personal information.
                Your identity remains private while you connect with others.
              </p>
            </div>

            {/* Easy to Use */}
            <div className="bg-[#44475a] p-8 rounded-lg border-2 border-[#bd93f9] shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-[#50fa7b]">⚡ Simple & Fast</h3>
              <p className="text-[#f8f8f2] leading-relaxed">
                Clean, intuitive interface that gets out of your way. Add contacts,
                start chatting, and enjoy a distraction-free messaging experience.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-20">
            <h3 className="text-3xl font-bold mb-8 text-[#ff79c6]">
              Ready to Start Chatting?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <button className="px-10 py-4 bg-[#50fa7b] text-[#282a36] rounded-lg font-bold text-xl hover:bg-[#ff79c6] transition-colors shadow-lg">
                  Create Account
                </button>
              </Link>
              <Link href="/login">
                <button className="px-10 py-4 bg-transparent border-2 border-[#bd93f9] text-[#bd93f9] rounded-lg font-bold text-xl hover:bg-[#bd93f9] hover:text-[#282a36] transition-colors">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
