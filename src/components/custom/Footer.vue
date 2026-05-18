<script setup lang="ts">
import { computed } from 'vue';
import { repository } from '@/../package.json';

const deployedInfo = computed(() => {
	const commit = import.meta.env.VERCEL_GIT_COMMIT_SHA;
	return {
		commit: commit? commit.slice(0, 7): null,
		url: `https://github.com/${repository.split(':')[1].split('.')[0]}/commit/${commit}`
	}
});
</script>

<template>
	<footer class="sticky bottom-0 w-full bg-gray-100/20 dark:bg-gray-800/20 p-4 flex items-center justify-between">
		<div>
			<p class="font-bold mb-2">
				CloudNotFlare
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
					Preview
				</span>
			</p>
			<p class="text-sm text-gray-500 dark:text-gray-400 *:not-last:pr-2 *:not-first:ml-2 *:not-last:border-r-2 *:not-last:border-border">
				<span>
					&copy; 2026 <a class="text-primary hover:underline" href="https://github.com/LateDreamXD">LateDreamXD</a>
				</span>
				<span v-if="deployedInfo.commit">
					<a :href="deployedInfo.url" target="_blank" rel="noopener noreferrer"><code>{{ deployedInfo.commit }}</code></a>
				</span>
			</p>
		</div>
		<div>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				CloudNotFlare 并非 Cloudflare 的官方产品，也未经授权
			</p>
		</div>
	</footer>
</template>
