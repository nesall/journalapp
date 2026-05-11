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
		class="fixed inset-x-0 bottom-0 z-50 flex max-h-[98dvh] flex-col rounded-t-2xl bg-surface-100-900 shadow-xl h-[90dvh] m-0"
		transition:fly={{ y: 600, duration: 300 }}
		role="dialog"
		aria-modal="true"
	>
		<!-- Handle -->
		<div class="flex justify-center pt-3 pb-1 shrink-0">
			<div class="h-1.5 w-10 rounded-full bg-surface-300"></div>
		</div>

		<!-- Scrollable content -->
		<div class="flex-1 flex min-h-0">
			{@render children()}
		</div>
	</div>
{/if}