import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	build: {
		modulePreload: true,
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [
						{name: 'vue-bundle', test: /node_modules\/(vue|vue-router|pinia)/},
						{name: 'stores', test: /src\/stores/},
						{name: 'libs', test: /src\/lib/},
						{name: 'router', test: /src\/router/},
					]
				}
			}
		}
	},
	plugins: [vue(), tailwindcss()],
	resolve: {
		alias: {
			'@': '/src',
		}
	},
	server: {
		proxy: {
			'/api': {
				target: 'https://api.cloudflare.com/client/v4',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ''),
			}
		}
	}
});
