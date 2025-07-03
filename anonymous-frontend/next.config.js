// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
	async rewrites() {
		return [
			{
				source: '/login',
				destination: 'http://localhost:8081/login',
			},
			{
				source: '/heartbeat',
				destination: 'http://localhost:8081/heartbeat',
			},

			{
				source: '/ws',
				destination: 'ws://localhost:8081/ws',
			},
			{
				source: '/auth/google/callback',
				destination: 'https://anonymous-production-5c21.up.railway.app/auth/google/callback'
			}
		]
	},
}
