'use client';
import Footer from '@/components/footer';
import StockChart from '@/components/StockChart';
import { mdiAccountPlus, mdiGoogle, mdiShieldLockOutline, mdiSlashForward } from '@mdi/js';
import Icon from '@mdi/react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Herobg from '../components/herobg';

const DEMO_CHART = {
  symbol: 'GOOG',
  period: '6mo',
  points: [
    { date: '2026-01-22', close: 254.1 },
    { date: '2026-02-05', close: 249.8 },
    { date: '2026-02-19', close: 263.4 },
    { date: '2026-03-05', close: 258.9 },
    { date: '2026-03-19', close: 271.2 },
    { date: '2026-04-02', close: 266.5 },
    { date: '2026-04-16', close: 280.7 },
    { date: '2026-04-30', close: 292.3 },
    { date: '2026-05-14', close: 288.1 },
    { date: '2026-05-28', close: 301.6 },
    { date: '2026-06-11', close: 315.2 },
    { date: '2026-06-25', close: 309.8 },
    { date: '2026-07-09', close: 327.4 },
    { date: '2026-07-22', close: 341.9 },
  ],
};

const FEATURES = [
  {
    icon: mdiAccountPlus,
    title: 'Add contacts',
    text: 'Connect with other traders. Enter a username to start chatting anonymously.',
  },
  {
    icon: mdiSlashForward,
    title: 'Use bot commands',
    text: 'Type / for stock commands — live quotes, charts, news, and market data right in the chat.',
  },
  {
    icon: mdiShieldLockOutline,
    title: 'Private by design',
    text: 'Share insights with your network. No central storage, no tracking. Conversations stay private.',
  },
  {
    icon: mdiGoogle,
    title: 'Google sign-in',
    text: 'Sign in with your Google account for quick, secure access. No password needed.',
  },
];

export default function LandingPage() {
  return (
    <>
      <Herobg />
      <div className="relative min-h-screen flex flex-col text-[#f8f8f2]">
        <div className="relative z-10 flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 flex flex-col items-center px-4 pt-20 md:pt-24 pb-16">
            <div className="w-full max-w-6xl">
              {/* Hero */}
              <div className="text-center mb-12 md:mb-16">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
                  Anonymous<span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}> for </span>Traders
                </h1>
                <p className="text-lg md:text-xl text-[#b4bac9] max-w-2xl mx-auto leading-relaxed mb-8">
                  Real-time messaging with built-in market data. Pull live quotes, charts, and
                  news into the conversation with a slash command.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href="/chat">
                    <button className="px-6 py-3 bg-[#bd93f9] text-[#21222c] rounded-full font-bold hover:bg-[#caa5fb] transition-colors">
                      Start chatting →
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="px-6 py-3 rounded-full font-medium text-[#c9ccd6] bg-[#21222c]/80 border border-[#33354a] hover:border-[#bd93f9] hover:text-[#f8f8f2] transition-colors">
                      Create account
                    </button>
                  </Link>
                </div>
                <Link href="/login" className="group inline-block mt-6">
                  <span className="inline-flex items-center gap-2.5 text-sm md:text-base font-mono text-[#e4e6ee] bg-[#bd93f9]/10 border border-[#bd93f9]/40 rounded-full px-5 py-2.5 group-hover:border-[#bd93f9] group-hover:bg-[#bd93f9]/15 transition-colors">
                    Try the demo →
                    <span className="text-[#bd93f9] font-bold">testuser1</span>
                    <span className="text-[#6b6f80]">/</span>
                    <span className="text-[#bd93f9] font-bold">testpassword1</span>
                  </span>
                </Link>
              </div>

              {/* Chat preview + features */}
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                {/* Mock chat window */}
                <div className="rounded-2xl border border-[#33354a] bg-[#21222c] overflow-hidden shadow-2xl shadow-black/40">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#33354a]">
                    <div className="w-8 h-8 rounded-full bg-[#2f3142] text-[#bd93f9] flex items-center justify-center font-bold text-[10px]">
                      TE
                    </div>
                    <div className="text-sm font-semibold">testuser2</div>
                  </div>

                  <div className="p-4 space-y-2.5 bg-[#1a1b23]">
                    <div className="flex justify-start">
                      <div className="bg-[#2f3142] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm">
                        GOOG killed earnings 👀
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-[#bd93f9] text-[#21222c] rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-medium">
                        /chart GOOG 6mo
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-[#21222c] ring-1 ring-[#33354a] rounded-2xl p-3">
                        <StockChart data={DEMO_CHART} />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-[#bd93f9] text-[#21222c] rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-medium">
                        /buy GOOG 1
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="flex items-start gap-3 bg-[#21222c] ring-1 ring-[#50fa7b]/25 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#50fa7b]/10 text-[#50fa7b]">
                          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#f8f8f2]">Bought 1 share of GOOG</p>
                          <p className="mt-1 text-xs text-[#a3a9bd]">
                            ${DEMO_CHART.points[DEMO_CHART.points.length - 1].close.toFixed(2)} per share
                            <span className="text-[#50fa7b]"> · Order filled</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-[#bd93f9] text-[#21222c] rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-medium">
                        let&apos;s go 🚀
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 px-4 py-3 border-t border-[#33354a]">
                    <div className="flex-1 bg-[#2a2c39] rounded-full px-4 py-2 text-sm text-[#6b6f80] select-none">
                      Type a message…  ( / for commands )
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#bd93f9] text-[#21222c] flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2 11 13" />
                        <path d="M22 2 15 22 11 13 2 9 22 2Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* How it works */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">How it works</h2>
                  <div className="space-y-2">
                    {FEATURES.map(f => (
                      <div
                        key={f.title}
                        className="flex items-start gap-4 rounded-xl border border-transparent hover:border-[#33354a] hover:bg-[#21222c]/70 transition-colors p-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#bd93f9]/10 text-[#bd93f9] flex items-center justify-center shrink-0">
                          <Icon path={f.icon} size={0.8} color="currentColor" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{f.title}</h3>
                          <p className="text-[15px] text-[#a3a9bd] leading-relaxed">{f.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
