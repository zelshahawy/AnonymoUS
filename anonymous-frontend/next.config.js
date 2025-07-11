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
				source: '/auth/google/callback',
				destination: 'http://localhost:8081/auth/google/callback',
			}
		]
	},
}
