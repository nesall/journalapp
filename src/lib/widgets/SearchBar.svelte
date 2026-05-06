<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	interface Props {
		placeholder?: string;
		onEmpty?: () => void;
	}

	let { placeholder = 'Search...', onEmpty }: Props = $props();

	let q = $state(page.url.searchParams.get('q') ?? '');

	let debounceTimer: ReturnType<typeof setTimeout>;

	function onInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const url = new URL(page.url);
			if (q.trim()) {
				url.searchParams.set('q', q.trim());
			} else {
				url.searchParams.delete('q');
				onEmpty?.();
			}
			goto(url.toString(), { keepFocus: true, replaceState: true });
		}, 300);
	}

	function clear() {
		q = '';
		const url = new URL(page.url);
		url.searchParams.delete('q');
		goto(url.toString(), { replaceState: true });
		onEmpty?.();
	}
</script>

<div class="relative flex items-center">
	<span class="absolute left-3 text-surface-400">🔍</span>
	<input type="text" class="input pr-8 pl-9" {placeholder} bind:value={q} oninput={onInput} />
	{#if q}
		<button
			type="button"
			class="absolute right-3 text-surface-400 hover:text-surface-600"
			onclick={clear}>✕</button
		>
	{/if}
</div>

