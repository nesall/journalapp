<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { NoteMedia } from '$lib/types';

	interface Props {
		images: NoteMedia[];
		startIndex?: number;
		title?: string;
		date?: string;
		onClose: () => void;
	}

	let { images, startIndex = 0, onClose, title = '', date = '' }: Props = $props();

	let current = $state(0);

	$effect(() => {
		current = startIndex;
	});

	function prev() {
		current = (current - 1 + images.length) % images.length;
	}

	function next() {
		current = (current + 1) % images.length;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		if (e.key === 'ArrowLeft') prev();
		if (e.key === 'ArrowRight') next();
	}

	// Swipe support
	let touchStartX = 0;

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
	}

	function onTouchEnd(e: TouchEvent) {
		const delta = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(delta) < 50) return; // ignore small movements
		delta < 0 ? next() : prev();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 m-0"
	transition:fade={{ duration: 150 }}
	role="dialog"
	aria-modal="true"
>
	<!-- Top bar -->
	<div class="absolute top-0 right-0 left-0 flex items-center justify-between px-4 py-3">
		<span class="text-sm text-white/60">
			{#if images.length > 1}{current + 1} / {images.length}{/if}
		</span>
		<span class="text-sm text-white/80">
			{title}
			{date ? `- ${new Date(date).toLocaleDateString()}` : ''}
		</span>
		<button
			type="button"
			class="text-2xl leading-none text-white/80 hover:text-white"
			onclick={onClose}>✕</button
		>
	</div>

	<!-- Image -->
	<div
		class="flex h-full w-full items-center justify-center px-12"
		ontouchstart={onTouchStart}
		ontouchend={onTouchEnd}
		role="button"
		tabindex="0"
	>
		<img
			src={images[current].url}
			alt="Full size"
			class="max-h-[85vh] max-w-full object-contain select-none"
		/>
	</div>

	<!-- Prev / Next -->
	{#if images.length > 1}
		<button
			type="button"
			class="absolute top-1/2 left-2 -translate-y-1/2 px-2 py-4 text-3xl text-white/70 hover:text-white"
			onclick={prev}>‹</button
		>
		<button
			type="button"
			class="absolute top-1/2 right-2 -translate-y-1/2 px-2 py-4 text-3xl text-white/70 hover:text-white"
			onclick={next}>›</button
		>

		<!-- Dots -->
		<div class="absolute bottom-6 flex gap-2">
			{#each images as _, i}
				<button
					type="button"
					aria-label={`Go to image ${i + 1}`}
					class="h-2 w-2 rounded-full transition-all {i === current
						? 'scale-125 bg-white'
						: 'bg-white/40'}"
					onclick={() => (current = i)}
				></button>
			{/each}
		</div>
	{/if}
</div>
