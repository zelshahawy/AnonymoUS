import dynamic from 'next/dynamic'

// Dynamically import the client-only component (no SSR)
const RegisterClient = dynamic(
	() => import('./register-client'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-screen flex items-center justify-center text-white">
				Loading…
			</div>
		)
	}
)

export default function RegisterPage() {
	return <RegisterClient />
}
