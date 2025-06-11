import { Suspense } from 'react'
import RegisterClient from './register-client'

export default function RegisterPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center text-white">
					Loading…
				</div>
			}
		>
			<RegisterClient />
		</Suspense>
	)
}
