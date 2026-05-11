<script setup lang="ts">
import { useDark } from '@vueuse/core';
import Footer from '@/components/custom/Footer.vue';

const dark = useDark();
</script>

<template>
	<main class="w-full min-h-full flex items-center justify-center">
		<router-view />
	</main>
	<Footer />
</template>
