<script lang="ts">
	import type { LayoutData } from './$types';
	import SearchBar from '$lib/widgets/SearchBar.svelte';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';

	let { data, children }: { data: LayoutData; children: any } = $props();

	// auto-open if q is already in URL (e.g. navigating back)
	let searchOpen = $state(!!page.url.searchParams.get('q'));

	function toggleSearch() {
		searchOpen = !searchOpen;
	}
</script>

<div class="flex h-screen flex-col">
	<header class="shadow-lg bg-primary-50-950 px-4 py-3">
		<div class="flex items-center justify-between gap-3">
			<h1 class="shrink-0 h3 font-bold">Journal</h1>
			<div class="flex shrink-0 items-center gap-2">
				<button
					type="button"
					class="btn btn-sm {searchOpen
						? 'preset-filled-primary-500'
						: 'preset-outlined-primary-200-800'}"
					onclick={toggleSearch}>🔍</button
				>
				<span class="hidden text-sm text-surface-700-300 sm:block">
					{data.user.display_name ?? data.user.email}
				</span>
				<form method="POST" action="/logout">
					<button type="submit" class="variant-soft btn btn-sm">Logout</button>
				</form>
			</div>
		</div>
	</header>

	<!-- Collapsible search bar -->
	{#if searchOpen}
		<div class="border-b border-surface-300 px-4 py-2" transition:slide={{ duration: 200 }}>
			<SearchBar placeholder="Search topics and entries..." />
		</div>
	{/if}

	<main class="flex flex-1 flex-col min-h-0">
		{@render children()}
	</main>
</div>
