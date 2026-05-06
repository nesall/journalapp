<script lang="ts">
	import { onMount } from 'svelte';
	// import { testData } from '$lib/testdata';
	import NoteBox from './NoteBox.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();

	let newEntryId = $state<string | null>(null);

	onMount(async () => {});

	// when server returns newEntryId, store it so NoteBox can auto-open in editMode
	$effect(() => {
		if (form?.newEntryId) {
			newEntryId = form.newEntryId;
		}
	});
</script>

<div
	class="bg-surface-200-700-token container mx-auto flex flex-col space-y-6 overflow-y-auto card p-6 shadow lg:max-w-2xl"
>
	<div class="mb-4 flex items-center justify-between gap-2">
		<a href="/journal" class="btn preset-tonal-primary">&larr;</a>
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
				};
			}}
		>
			<button type="submit" class="btn preset-filled-primary-500">&#x2B;</button>
		</form>
	</div>

	{#if data.q}
		<div class="flex items-center gap-2 bg-surface-200 px-4 py-2 text-sm">
			<span>Results for <strong>"{data.q}"</strong> — {data.entries.length} found</span>
		</div>
	{/if}

	<div class="flex flex-col space-y-4">
		{#each data.entries as note}
			<NoteBox
				{note}
				topicId={data.topic.id}
				onMutate={invalidateAll}
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
