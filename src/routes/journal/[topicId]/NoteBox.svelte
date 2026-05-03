<script lang="ts">
	import { onMount } from 'svelte';
	import type { Note } from '$lib/types';
	import { formatDate, formatTime, moods } from '$lib/utils';
	import { slide } from 'svelte/transition';

	interface Props {
		note: Note;
		autoEdit?: boolean;
		onSave?: (updated: Partial<Note>) => Promise<void>;
		onDelete?: (id: string) => Promise<void>;
	}

	let { note, autoEdit = false, onSave, onDelete }: Props = $props();

	let interactiveMode = $state(false);
	let editMode = $state(false);

	let editMood = $state(0);

	onMount(() => {
		editMood = note.mood || 0;
	});

	function enterEdit() {
		editMood = note.mood || 0;
		interactiveMode = true;
		editMode = true;
	}

	async function cancelEdit() {
		if (autoEdit && !bodyEl?.innerText.trim()) {
			await onDelete?.(note.id);
			return;
		}
		editMode = false;
		interactiveMode = false;
	}

	async function saveEdit() {
		const updatedTitle = titleEl?.innerText.trim() ?? '';
		const updatedBody = bodyEl?.innerText.trim() ?? '';
		if (!updatedBody) {
			await onDelete?.(note.id);
			return;
		}
		await onSave?.({ id: note.id, title: updatedTitle, body: updatedBody, mood: editMood });
		cancelEdit();
	}

	async function deleteNote() {
		if (confirm('Are you sure you want to delete this note?')) {
			await onDelete?.(note.id);
		}
	}

	const images = $derived(note.media || []);

	const gridClass = $derived(
		images.length === 1
			? 'layout-1'
			: images.length === 2
				? 'layout-2'
				: images.length === 3
					? 'layout-3'
					: 'layout-4plus'
	);

	let uploading = $state(false);

	async function handleImageUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('entry_id', note.id);

			const res = await fetch(`/journal/${note.topic_id}/media`, {
				method: 'POST',
				body: formData
			});

			if (!res.ok) throw new Error(await res.text());

			const newMedia = await res.json();
			// notify parent to refresh or optimistically update
			await onSave?.({ id: note.id }); // triggers parent reload
		} catch (err) {
			console.error('Upload failed', err);
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	async function removeImage(mediaId: string) {
		if (!confirm('Remove this image?')) return;

		const res = await fetch(`/journal/${note.topic_id}/media`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mediaId })
		});

		if (res.ok) await onSave?.({ id: note.id }); // triggers parent reload
	}

	let bodyEl = $state<HTMLDivElement | null>(null);
	let titleEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (bodyEl && !editMode) bodyEl.innerText = note.body;
		if (titleEl && !editMode) titleEl.innerText = note.title ?? 'Untitled';
	});
	$effect(() => {
		if (autoEdit) enterEdit();
	});
</script>

<div
	class="flex h-full flex-col space-y-2 card px-4 py-2 shadow"
	onblur={(e) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) interactiveMode = false;
	}}
	tabindex="-1"
>
	<div class="flex items-center text-sm font-bold capitalize">
		<div
			bind:this={titleEl}
			contenteditable={editMode}
			class="flex-1 outline-none {editMode && !(note.title || '').trim()
				? ''
				: 'text-surface-400'}"
		>
			{note.title}
		</div>
		{#if editMode}
			<div class="ml-auto flex gap-1">
				{#each moods as emoji, i}
					<button
						type="button"
						class="text-lg transition-all {editMood === i + 1
							? 'scale-125 opacity-100'
							: 'opacity-40 hover:opacity-80'}"
						onclick={() => (editMood = editMood === i + 1 ? 0 : i + 1)}>{emoji}</button
					>
				{/each}
			</div>
		{:else if note.mood}
			<span class="ml-auto text-lg text-surface-500">{moods[note.mood - 1]}</span>
		{/if}
	</div>
	<hr class="hr" />
	{#if editMode}
		<div class="flex flex-wrap items-center gap-2">
			{#each images as media}
				<div class="group relative">
					<img src={media.url} alt="media" class="h-16 w-16 rounded object-cover" />
					<button
						type="button"
						class="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full
                 bg-error-500 text-xs text-white"
						onclick={() => removeImage(media.id)}
					>
						✕
					</button>
				</div>
			{/each}
			<label
				class="flex h-16 w-16 cursor-pointer items-center justify-center
              rounded border-2 border-dashed border-surface-400 text-surface-400
              transition-colors hover:border-primary-500 hover:text-primary-500"
			>
				<input type="file" accept="image/*" class="hidden" onchange={handleImageUpload} />
				<span class="text-2xl">+</span>
			</label>
		</div>
	{:else if images.length > 0}
		<div class="gallery {gridClass}">
			{#each images as media, j}
				{#if j < 10}
					<img src={media.url} alt="Note media" style="max-height2:64px" />
				{/if}
			{/each}
		</div>
	{/if}

	<div
		bind:this={bodyEl}
		class="px-0 text-sm outline-none {editMode
			? 'border-b border-surface-300 pb-1 focus:border-primary-500'
			: 'truncate-text'}"
		contenteditable={editMode}
	>
		{note.body}
	</div>
	<hr class="hr" />
	{#if editMode}
		<div class="flex items-center gap-2" transition:slide>
			<button class="btn flex-1 preset-filled-primary-500 btn-sm" onclick={saveEdit}>
				&#10003; Save
			</button>
			<button class="ml-auto btn flex-1 preset-outlined-secondary-500 btn-sm" onclick={cancelEdit}>
				&#10005; Cancel
			</button>
		</div>
	{:else if interactiveMode}
		<div class="flex items-center gap-2" transition:slide>
			<button
				type="button"
				class="btn flex-1 preset-outlined-secondary-500 btn-sm"
				onclick={enterEdit}
			>
				✏️ Edit
			</button>
			<button class="ml-auto btn flex-1 preset-filled-error-500 btn-sm" onclick={deleteNote}>
				🗑️ Delete
			</button>
		</div>
	{/if}
	<div class="flex w-full flex-row items-center text-xs">
		<span>{formatDate(note.created_at)} {formatTime(note.created_at)}</span>
		{#if !editMode}
			{#if interactiveMode}
				<button
					class="ml-auto btn preset-outlined-secondary-500 btn-sm"
					onclick={() => (interactiveMode = false)}
				>
					&#10005;
				</button>
			{:else}
				<button
					type="button"
					class="ms-auto btn preset-outlined-surface-500 btn-sm"
					onclick={() => (interactiveMode = true)}
				>
					&#8942;
				</button>
			{/if}
		{/if}
	</div>
</div>

<style>
	.truncate-text {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 4; /* Limit to 4 lines */
		line-clamp: 4; /* Standard property for compatibility */
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.gallery {
		display: grid;
		gap: 4px;
		overflow: hidden;
	}

	/* Single Image (Full Width) */
	.layout-1 {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}

	/* Two Images (Side by Side) */
	.layout-2 {
		grid-template-columns: 1fr 1fr;
	}

	/* Three Images (One Large, Two Small) */
	.layout-3 {
		grid-template-columns: 2fr 1fr;
		grid-template-rows: 1fr 1fr;
	}
	.layout-3 img:first-child {
		grid-row: span 2; /* Large first image */
	}

	/* Four or More Images (Masonry-like Layout) */
	.layout-4plus {
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	}

	.gallery img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
	}
</style>
