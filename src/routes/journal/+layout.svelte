<script lang="ts">
	import type { LayoutData } from './$types';
	import SearchBar from '$lib/widgets/SearchBar.svelte';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import { searchState } from '$lib/sharedState.svelte';

	let { data, children }: { data: LayoutData; children: any } = $props();

	// auto-open if q is already in URL (e.g. navigating back)
	let searchOpen = $state(!!page.url.searchParams.get('q'));

	function toggleSearch() {
		searchOpen = !searchOpen;
	}
</script>

<div class="flex h-screen flex-col">
	<header class="bg-primary-50-950 px-4 py-3 shadow-lg">
		<div class="flex items-center justify-between gap-3">
			<h1 class="shrink-0 h3 font-bold">Journal</h1>
			<div class="relative hidden px-4 py-2 md:inline-block">
				<div>
					<SearchBar placeholder="Search topics and entries..." />
				</div>
				{#if searchState.nofHits !== null}
					<div
						class="absolute right-0 flex items-center gap-2 bg-surface-200 px-4 py-2 text-sm"
					>
						<span>{searchState.nofHits} result{searchState.nofHits > 1 ? 's' : ''} found</span>
					</div>
				{/if}
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<button
					type="button"
					class="btn btn-sm {searchOpen
						? 'preset-filled-primary-500'
						: 'preset-outlined-primary-200-800'}
						md:hidden"
					onclick={toggleSearch}>🔍</button
				>
				<span class="hidden text-sm text-surface-700-300 sm:block">
					{data.user.display_name ?? data.user.email}
				</span>
				<form method="POST" action="/logout">
					<button type="submit" class="btn flex items-center gap-1 btn-sm md:preset-tonal">
						<span class="text-lg">&#x21A6;</span>
						<span class="hidden md:inline-block">Logout</span>
					</button>
				</form>
			</div>
		</div>
	</header>

	<!-- Collapsible search bar -->
	{#if searchOpen}
		<div class="border-b border-surface-300 px-4 py-2" transition:slide={{ duration: 200 }}>
			<SearchBar placeholder="Search topics and entries..." />
		</div>
		{#if searchState.nofHits !== null}
			<div class="flex items-center gap-2 bg-surface-200 px-4 py-2 text-sm">
				<span>{searchState.nofHits} result{searchState.nofHits > 1 ? 's' : ''} found</span>
			</div>
		{/if}
	{/if}

	<main class="flex min-h-0 flex-1 flex-col">
		{@render children()}
	</main>
</div>
