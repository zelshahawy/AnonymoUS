'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function RedirectLogin() {
	const router = useRouter()
	const [count, setCount] = useState(2)

	useEffect(() => {
		// countdown display
		const interval = setInterval(() => {
			setCount(c => Math.max(0, c - 1))
		}, 1000)

		const timer = setTimeout(() => {
			clearInterval(interval)
			router.push('/login')
		}, 2000)

		return () => {
			clearTimeout(timer)
			clearInterval(interval)
		}
	}, [router])

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<p className="text-gray-200 text-center">
				You must be logged in to view chat.<br />
				Redirecting to{' '}
				<Link href="/login" className="text-blue-400 underline">
					Login
				</Link>{' '}
				in {count}…
			</p>
		</div>
	)
}
