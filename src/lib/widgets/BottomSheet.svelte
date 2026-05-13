<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	interface Props {
		open: boolean;
		onClose: () => void;
		children: any;
	}

	let { open, onClose, children }: Props = $props();

	function onBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	const CLOSE_THRESHOLD = 120;

	let sheetEl = $state<HTMLDivElement | null>(null);
	let dragY = $state(0);
	let dragging = $state(false);
	let startY = 0;

	function onTouchStart(e: TouchEvent) {
		startY = e.touches[0].clientY;
		dragging = true;
	}

	function onTouchMove(e: TouchEvent) {
		if (!dragging) return;
		const delta = e.touches[0].clientY - startY;
		if (delta > 0) {
			dragY = delta;
		}
	}

	function onTouchEnd() {
		dragging = false;
		if (dragY > CLOSE_THRESHOLD) {
			dragY = 0;
			onClose();
		} else {
			dragY = 0; // snap back
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/50"
		transition:fade={{ duration: 150 }}
		onclick={onBackdropClick}
		role="presentation"
	></div>

	<!-- Sheet -->
	<div
		bind:this={sheetEl}
		class="fixed inset-x-0 bottom-0 z-50 m-0 mx-auto flex h-[90dvh] max-h-[98dvh] flex-col rounded-t-2xl bg-surface-100-900 shadow-xl lg:max-w-2xl"
		style="transform: translateY({dragY}px); transition: {dragging
			? 'none'
			: 'transform 0.3s ease'};"
		transition:fly={{ y: 600, duration: 300 }}
		role="dialog"
		aria-modal="true"
		ontouchstart={onTouchStart}
		ontouchend={onTouchEnd}
		tabindex="-1"
	>
		<!-- Handle -->
		<div
			class="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1"
			role="presentation"
			ontouchmove={onTouchMove}
		>
			<div class="h-1.5 w-10 rounded-full bg-surface-300"></div>
		</div>

		<!-- Scrollable content -->
		<div class="flex min-h-0 flex-1">
			{@render children()}
		</div>
	</div>
{/if}
