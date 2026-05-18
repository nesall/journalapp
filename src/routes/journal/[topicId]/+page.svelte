<script lang="ts">
	import { onMount } from 'svelte';
	import NoteBox from '$lib/widgets/NoteBox.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { searchState } from '$lib/sharedState.svelte';

	let { data, form }: PageProps = $props();

	let newEntryId = $state<string | null>(null);

	const PAGE_SIZE = 25;
	let visibleCount = $state(PAGE_SIZE);

	const visibleEntries = $derived(data.entries.slice(0, visibleCount));
	const hasMore = $derived(visibleCount < data.entries.length);

	onMount(async () => {});

	function loadMore() {
		visibleCount += PAGE_SIZE;
	}

	async function handleMutate() {
		await invalidateAll();
		newEntryId = null;
	}

	$effect(() => {
		data.entries;
		visibleCount = PAGE_SIZE;
	});

	$effect(() => {
		if (data.q) {
			searchState.nofHits = data.entries.length;
		} else {
			searchState.nofHits = null;
		}
	});
</script>

<div class="container mx-auto flex flex-col space-y-6 overflow-y-auto card p-6 shadow lg:max-w-2xl">
	<div class="mb-4 flex items-center justify-between gap-2">
		<a
			href="/journal{data.q ? '?q=' + encodeURIComponent(data.q) : ''}"
			class="btn preset-tonal-primary"
		>
			&larr;
		</a>
		<h2 class="flex items-center gap-2 pl-1 h2 font-bold">
			<span>{data.topic.name}</span>
			<span>{data.topic.icon}</span>
		</h2>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					await invalidateAll();
					newEntryId = form?.newEntryId ?? null;
				};
			}}
		>
			<button type="submit" class="btn preset-filled-primary-500" title="Add Entry"> + </button>
		</form>
	</div>

	<div class="flex flex-col space-y-4">
		{#each visibleEntries as note}
			<NoteBox
				{note}
				tags={data.tags}
				topicId={data.topic.id}
				onMutate={handleMutate}
				autoEdit={note.id === newEntryId}
			/>
		{/each}
	</div>

	{#if data.entries.length === 0}
		<div class="text-center text-surface-500">
			<p>No entries yet.</p>
		</div>
	{/if}

	{#if hasMore}
		<div class="flex justify-center py-6">
			<button type="button" class="btn preset-outlined-surface-500" onclick={loadMore}>
				Load more ({visibleCount} of {data.entries.length})
			</button>
		</div>
	{:else if data.entries.length > PAGE_SIZE}
		<p class="py-6 text-center text-xs text-surface-400">
			All {data.entries.length} entries loaded
		</p>
	{/if}
</div>

<style>
</style>
