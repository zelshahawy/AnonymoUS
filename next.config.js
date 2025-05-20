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
			// and if you need it for WS:
			{
				source: '/ws',
				destination: 'ws://localhost:8081/ws',
			},
		]
	},
}
