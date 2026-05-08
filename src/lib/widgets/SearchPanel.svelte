<script lang="ts">
	import SearchBar from './SearchBar.svelte';
	import { searchState } from '$lib/sharedState.svelte';

	interface Props {
		placeholder: string;
		inline?: boolean; // true = collapsible mobile, false = always visible desktop
	}

	let { placeholder, inline = false }: Props = $props();
</script>

<div class="relative {inline ? '' : 'px-4 py-2'}">
	<SearchBar {placeholder} />
	{#if searchState.nofHits !== null}
		<div class="
			{inline
				? 'flex items-center gap-2 bg-surface-200 px-4 py-2 text-sm'
				: 'absolute right-0 flex items-center gap-2 bg-surface-200 px-4 py-2 text-sm'}
		">
			<span>{searchState.nofHits} result{searchState.nofHits > 1 ? 's' : ''} found</span>
		</div>
	{/if}
</div>