<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

interface Props {
	class?: string;
}

const props = withDefaults(defineProps<Props>(), {});
</script>

<template>
	<div :class="cn('fixed inset-0 z-50 bg-black/80', props.class)" />
</template>
