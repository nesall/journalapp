<script lang="ts">
	import type { LayoutData } from './$types';
	import SearchPanel from '$lib/widgets/SearchPanel.svelte';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';

	let { data, children }: { data: LayoutData; children: any } = $props();

	let searchOpen = $state(!!page.url.searchParams.get('q'));
	const isInTopic = $derived(page.url.pathname.split('/').length > 2);
	const placeholder = $derived(isInTopic ? 'Search or tag:name...' : 'Search topics and entries...');
</script>

<div class="flex h-screen flex-col">
	<header class="bg-primary-50-950 px-4 py-3 shadow-lg">
		<div class="flex items-center justify-between gap-3">
			<h1 class="shrink-0 h3 font-bold">Journal</h1>

			<!-- Desktop: always visible -->
			<div class="relative hidden md:block flex-1 max-w-sm">
				<SearchPanel {placeholder} />
			</div>

			<div class="flex shrink-0 items-center gap-2">
				<!-- Mobile: toggle button -->
				<button
					type="button"
					class="btn btn-sm md:hidden {searchOpen ? 'preset-filled-primary-500' : 'preset-outlined-primary-200-800'}"
					onclick={() => searchOpen = !searchOpen}
				>🔍</button>
				<span class="hidden text-sm text-surface-700-300 sm:block">
					{data.user.display_name ?? data.user.email}
				</span>
				<form method="POST" action="/logout">
					<button type="submit" class="btn btn-sm flex items-center gap-1 md:preset-tonal">
						<span class="text-lg">&#x21A6;</span>
						<span class="hidden md:inline-block">Logout</span>
					</button>
				</form>
			</div>
		</div>
	</header>

	<!-- Mobile: collapsible search -->
	{#if searchOpen}
		<div class="border-b border-surface-300" transition:slide={{ duration: 200 }}>
			<SearchPanel {placeholder} inline />
		</div>
	{/if}

	<main class="flex min-h-0 flex-1 flex-col">
		{@render children()}
	</main>
</div>