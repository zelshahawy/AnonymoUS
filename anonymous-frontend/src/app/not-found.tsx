import Link from 'next/link';
import Herobg from '../components/herobg';
import Navbar from '../components/Navbar';

export default function NotFound() {
	return (
		<>
			<Herobg />
			<Navbar />
			<div className="min-h-screen flex flex-col items-center justify-center px-4 text-center text-[#f8f8f2]">
				<p className="text-7xl md:text-8xl font-bold text-[#bd93f9]/30 mb-4 font-mono">404</p>
				<h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Page not found</h1>
				<p className="mb-8 max-w-md text-[#8b8fa3] leading-relaxed">
					The page you are looking for does not exist. Check the URL or head back home.
				</p>
				<Link href="/">
					<button className="px-6 py-3 bg-[#bd93f9] text-[#21222c] rounded-full font-bold hover:bg-[#caa5fb] transition-colors">
						← Back home
					</button>
				</Link>
			</div>
		</>
	);
}
