<script lang="ts">
	import { onMount } from 'svelte';
	import NoteBox from '$lib/widgets/NoteBox.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { searchState } from '$lib/sharedState.svelte';
	import type { ActionResult } from '@sveltejs/kit';

	let { data, form }: PageProps = $props();

	let newEntryId = $state<string | null>(null);

	onMount(async () => {});

	async function handleMutate() {
		// console.log('Mutate called, invalidating all');
		await invalidateAll();
		newEntryId = null;
	}

	$effect(() => {
		// console.log('Form updated, newEntryId:', newEntryId, { data, form });
	});

	$effect(() => {
		if (data.q) {
			searchState.nofHits = data.entries.length;
		} else {
			searchState.nofHits = null;
		}
	});
</script>

<div
	class="container mx-auto flex flex-col space-y-6 overflow-y-auto card p-6 shadow lg:max-w-2xl"
>
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
		{#each data.entries as note}
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
</div>

<style>
</style>
