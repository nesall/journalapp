<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import type { Topic } from '$lib/types';
	import { searchState } from '$lib/sharedState.svelte';

	let { data }: { data: PageData } = $props();

	const emojis = [
		'📓',
		'🚗',
		'🏎️',
		'❤️',
		'🩺',
		'🌍',
		'💪',
		'🍔',
		'📚',
		'💰',
		'🎮',
		'🎵',
		'✈️',
		'🏠',
		'🖥️'
	];

	// per-topic interactive state
	let activeTopicId = $state<string | null>(null);
	let editingTopicId = $state<string | null>(null);
	let editName = $state('');
	let editIcon = $state('');

	function enterEdit(topic: Topic) {
		editName = topic.name;
		editIcon = topic.icon ?? '📓';
		editingTopicId = topic.id;
		activeTopicId = topic.id;
	}

	function cancelEdit() {
		editingTopicId = null;
		activeTopicId = null;
	}
	$effect(() => {
		if (!data.q) {
			searchState.nofHits = null;
		}
	});
</script>

{#if data.topics.length === 0}
	<div class="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
		{#if data.q}
			<p class="text-lg text-surface-500">No topics matching <strong>"{data.q}"</strong></p>
		{:else}
			<p class="text-lg text-surface-500">No topics yet.</p>
			<a href="/journal/topics/new" class="btn preset-filled-primary-500">
				Create your first topic
			</a>
		{/if}
	</div>
{:else}
	<div class="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4">
		{#each data.topics as topic}
			<div
				class="relative flex flex-col gap-2 card p-4 shadow transition-colors
				{activeTopicId === topic.id ? 'bg-surface-200-800' : 'bg-surface-100-900 hover:bg-surface-200-800'}"
			>
				{#if editingTopicId === topic.id}
					<!-- Edit mode -->
					<div class="mb-1 flex flex-wrap gap-1">
						{#each emojis as emoji}
							<button
								type="button"
								class="rounded p-1 text-xl {editIcon === emoji
									? 'bg-primary-500'
									: 'hover:bg-surface-300'}"
								onclick={() => (editIcon = emoji)}>{emoji}</button
							>
						{/each}
					</div>
					<input class="input-sm input" type="text" bind:value={editName} />
					<form
						method="POST"
						action="?/update"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
								cancelEdit();
							};
						}}
					>
						<input type="hidden" name="id" value={topic.id} />
						<input type="hidden" name="name" value={editName} />
						<input type="hidden" name="icon" value={editIcon} />
						<div class="mt-1 flex gap-2">
							<button type="submit" class="btn flex-1 preset-filled-primary-500 btn-sm">
								✓ Save
							</button>
							<button
								type="button"
								class="btn flex-1 preset-outlined-secondary-500 btn-sm"
								onclick={cancelEdit}
							>
								✕
							</button>
						</div>
					</form>
				{:else}
					<!-- Display mode -->
					<a
						href="/journal/{topic.id}{data.q ? '?q=' + encodeURIComponent(data.q) : ''}"
						class="flex flex-col items-center gap-2 py-2"
					>
						<span class="text-4xl">{topic.icon ?? '📓'}</span>
						<span class="text-center font-medium">{topic.name}</span>
					</a>

					{#if activeTopicId === topic.id}
						<!-- Action buttons -->
						<div class="flex gap-2">
							<button
								type="button"
								class="btn flex-1 preset-outlined-secondary-500 btn-sm"
								onclick={() => enterEdit(topic)}>✏️ Edit</button
							>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={topic.id} />
								<button
									type="submit"
									class="btn preset-filled-error-500 btn-sm"
									onclick={(e) => {
										if (!confirm('Delete topic and all its entries?')) e.preventDefault();
									}}>🗑️</button
								>
							</form>
						</div>
						<button
							type="button"
							class="btn w-full preset-outlined-surface-500 btn-sm"
							onclick={() => (activeTopicId = null)}>✕ Cancel</button
						>
					{:else}
						<div class="min-h-6"></div>
						<div class="absolute right-1 bottom-1 flex">
							<button
								type="button"
								class="ml-auto btn btn-sm"
								onclick={() => (activeTopicId = topic.id)}>⋮</button
							>
						</div>
					{/if}
				{/if}
			</div>
		{/each}

		<a
			href="/journal/topics/new"
			class="flex flex-col items-center gap-2 card border-2 border-dashed border-surface-400 p-6 transition-colors hover:border-primary-500"
		>
			<span class="text-4xl">＋</span>
			<span class="text-sm text-surface-500">New Topic</span>
		</a>
	</div>
{/if}
