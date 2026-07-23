'use client'
import Herobg from '@/components/herobg'
import Link from 'next/link'

export default function RedirectLogin() {
	return (
		<>
			<Herobg />
			<div className="min-h-screen flex items-center justify-center px-4 text-[#f8f8f2]">
				<div className="w-full max-w-sm bg-[#21222c]/90 border border-[#33354a] rounded-2xl p-8 text-center shadow-2xl shadow-black/40">
					<div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#bd93f9]/10 text-[#bd93f9] flex items-center justify-center">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<rect x="4" y="10" width="16" height="11" rx="2" />
							<path d="M8 10V7a4 4 0 0 1 8 0v3" />
						</svg>
					</div>
					<h1 className="text-2xl font-bold tracking-tight mb-2">Sign in to start chatting</h1>
					<p className="text-[#a3a9bd] text-[15px] leading-relaxed mb-7">
						Your conversations live behind your account. Sign in or create one — it takes seconds.
					</p>
					<div className="space-y-2.5">
						<Link href="/login" className="block">
							<button className="w-full bg-[#bd93f9] hover:bg-[#caa5fb] text-[#21222c] py-3 rounded-xl font-bold transition-colors">
								Sign in →
							</button>
						</Link>
						<Link href="/register" className="block">
							<button className="w-full bg-[#2a2c39] hover:bg-[#33354a] text-[#f8f8f2] py-3 rounded-xl font-semibold border border-[#33354a] transition-colors">
								Create account
							</button>
						</Link>
					</div>
					<Link href="/" className="inline-block mt-5 text-sm text-[#a3a9bd] hover:text-[#f8f8f2] transition-colors">
						← Back home
					</Link>
				</div>
			</div>
		</>
	)
}
