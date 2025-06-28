import Herobg from '../components/herobg';
import Navbar from '../components/Navbar';

export default function NotFound() {
	return (
		<>
			<Herobg />
			<Navbar />
			<div className="min-h-screen flex flex-col items-center justify-center px-4">
				<h1 className="text-5xl font-extrabold text-white mb-4">404 - Page Not Found</h1>
				<p className="mb-8 text-center max-w-xl text-gray-200">
					The page you are looking for does not exist. Please check the URL or return to the homepage.
				</p>
			</div>
		</>
	);
}
