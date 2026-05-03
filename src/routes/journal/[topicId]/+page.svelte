<script lang="ts">
	import { onMount } from 'svelte';
	// import { testData } from '$lib/testdata';
	import NoteBox from './NoteBox.svelte';
	import type { Note } from '$lib/types';
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();

	let newEntryId = $state<string | null>(null);

	onMount(async () => {
		console.log('Dashboard Page Mounted');
	});

	// when server returns newEntryId, store it so NoteBox can auto-open in editMode
	$effect(() => {
		if (form?.newEntryId) {
			newEntryId = form.newEntryId;
		}
	});

	// const notes = $derived(testData.notes);

	async function handleSave(updated: Partial<Note>) {
		const res = await fetch(`/journal/${data.topic.id}/entries`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updated)
		});
		if (res.ok) invalidateAll(); // re-runs load(), refreshes entries
	}

	async function handleDelete(id: string) {
		const res = await fetch(`/journal/${data.topic.id}/entries`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id })
		});
		if (res.ok) invalidateAll();
	}

	async function onAddNew() {
		// TODO:
	}
</script>

<div
	class="bg-surface-200-700-token container mx-auto flex flex-col space-y-6 card p-6 shadow lg:max-w-2xl"
>
	<div class="mb-4 flex items-center justify-between">
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
			<button type="submit" class="btn preset-filled-primary-500 btn-sm"> + Add Note </button>
		</form>
	</div>
	<div class="flex flex-col space-y-4">
		{#each data.entries as note}
			<NoteBox
				{note}
				onSave={handleSave}
				onDelete={handleDelete}
				autoEdit={note.id === newEntryId}
			/>
		{/each}
	</div>
</div>

<style>
</style>
