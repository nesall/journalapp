<script lang="ts">
	import { onMount } from 'svelte';
	import type { Note, TopicTag } from '$lib/types';
	import { formatDate, formatDateYYYYMMDD, moods } from '$lib/utils';
	import { slide } from 'svelte/transition';
	import Lightbox from '$lib/widgets/Lightbox.svelte';
	import TagPicker from '$lib/widgets/TagPicker.svelte';

	interface Props {
		note: Note;
		topicId: string;
		tags?: TopicTag[];
		autoEdit?: boolean;
		onMutate?: () => void;
	}

	let { note, topicId, tags = [], autoEdit = false, onMutate }: Props = $props();

	let interactiveMode = $state(false);
	let editMode = $state(false);
	let saving = $state(false);
	let deleting = $state(false);
	let editMood = $state(0);
	let editDate = $state('');
	let editTagId = $state<string | null>(null);
	let editTagName = $state<string | null>(null);
	let editTagColor = $state<string | null>(null);
	let lightboxIndex = $state<number | null>(null);

	onMount(() => {
		editMood = note.mood || 0;
		editDate = formatDateYYYYMMDD(note.entry_date);
		editTagId = note.tag_id ?? null;
		editTagName = note.tag?.name ?? null;
		editTagColor = note.tag?.color ?? null;
		console.log('NoteBox Mounted', { note }, { editMood, editDate });
	});

	function enterEdit() {
		editMood = note.mood || 0;
		editDate = formatDateYYYYMMDD(note.entry_date);
		editTagId = note.tag_id ?? null;
		editTagName = note.tag?.name ?? null;
		editTagColor = note.tag?.color ?? null;
		interactiveMode = true;
		editMode = true;
	}

	async function cancelEdit() {
		if (bodyEl) bodyEl.innerText = note.body;
		if (titleEl) titleEl.innerText = note.title ?? '';
		editMood = note.mood ?? 0;
		editDate = formatDateYYYYMMDD(note.entry_date);
		editMode = false;
		interactiveMode = false;
	}

	async function saveEdit() {
		const updatedTitle = titleEl?.innerText.trim() ?? '';
		const updatedBody = bodyEl?.innerText.trim() ?? '';
		if (!updatedBody) {
			alert('Body cannot be empty');
			return;
		}
		if (!updatedBody && !updatedTitle) {
			await deleteNote();
			return;
		}
		saving = true;
		try {
			const res = await fetch(`/journal/${topicId}/entries`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: note.id,
					title: updatedTitle || null,
					body: updatedBody,
					mood: editMood || null,
					entry_date: editDate,
					topic_id: topicId,
					tag_id: editTagId,
					tag_name: editTagName,
					tag_color: editTagColor
				})
			});
			console.log('Save response', { res });
			if (!res.ok) throw new Error(await res.text());
			onMutate?.();
			editMode = false;
			interactiveMode = false;
		} catch (err) {
			console.error('Save failed', err);
		} finally {
			saving = false;
		}
	}

	async function deleteNote() {
		if (!autoEdit && !confirm('Delete this note?')) return;

		deleting = true;
		try {
			const res = await fetch(`/journal/${topicId}/entries`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: note.id })
			});

			if (!res.ok) throw new Error(await res.text());
			onMutate?.();
		} catch (err) {
			console.error('Delete failed', err);
		} finally {
			deleting = false;
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

	async function removeImage(mediaId: string) {
		if (!confirm('Remove this image?')) return;

		const res = await fetch(`/journal/${topicId}/media`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mediaId })
		});

		if (res.ok) onMutate?.();
	}

	async function handleImageUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('entry_id', note.id);

		const res = await fetch(`/journal/${topicId}/media`, {
			method: 'POST',
			body: formData
		});

		if (res.ok) onMutate?.();
		else console.error('Upload failed', await res.text());
		input.value = '';
	}

	function onTagChange(tagId: string | null, tagName: string | null, tagColor: string | null) {
		console.log('Tag changed', { tagId, tagName, tagColor });
		editTagId = tagId;
		editTagName = tagName;
		editTagColor = tagColor;
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
	class="flex h-full flex-col space-y-2 card border-surface-300 px-4 py-2
     shadow-lg outline-none focus:border-primary-500"
	onblur={(e) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) interactiveMode = false;
	}}
	tabindex="-1"
>
	<div class="flex items-center text-sm font-bold capitalize">
		<div bind:this={titleEl} contenteditable={editMode} class="flex-1 outline-none">
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
					<button type="button" onclick={() => (lightboxIndex = j)}>
						<img src={media.url} alt="Note media" class="cursor-pointer" />
					</button>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Lightbox -->
	{#if lightboxIndex !== null}
		<Lightbox
			{images}
			startIndex={lightboxIndex}
			onClose={() => (lightboxIndex = null)}
			title={note.title || 'Untitled'}
			date={note.entry_date}
		/>
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
			<button
				class="btn flex-1 preset-filled-primary-500 btn-sm"
				onclick={saveEdit}
				disabled={saving}
			>
				{saving ? '...' : '✓ Save'}
			</button>
			<button class="ml-auto btn flex-1 preset-outlined-secondary-500 btn-sm" onclick={cancelEdit}>
				✕ Cancel
			</button>
		</div>
	{:else if interactiveMode}
		<div class="flex items-center gap-2" transition:slide>
			<button
				type="button"
				class="btn flex-1 preset-outlined-secondary-500 btn-sm"
				onclick={enterEdit}
				disabled={deleting}
			>
				✏️ Edit
			</button>
			<button class="ml-auto btn flex-1 preset-filled-error-500 btn-sm" onclick={deleteNote}>
				{deleting ? '...' : '🗑️ Delete'}
			</button>
		</div>
	{/if}
	<div class="flex w-full flex-row items-center text-xs">
		{#if editMode}
			<div class="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center">
				<input
					type="date"
					id="editDate_{note.id}"
					class="input-sm input text-xs"
					bind:value={editDate}
				/>
				<TagPicker {tags} selectedTagId={editTagId} onChange={onTagChange} />
			</div>
		{:else}
			<div class="flex items-center gap-4">
				<span>{formatDate(note.entry_date)}</span>
				{#if note.tag}
					<span
						class="rounded-full px-1 pr-2 py-0.5 text-xs text-white flex items-center gap-1"
						style="background-color: {note.tag.color}"
					>
						<span>🏷️</span><span>{note.tag.name}</span>
					</span>
				{/if}
			</div>
		{/if}
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
		-webkit-line-clamp: 4;
		line-clamp: 4;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.gallery {
		display: grid;
		gap: 4px;
		overflow: hidden;
		min-height: 0;
		height: 200px;
	}
	.gallery > * {
		min-height: 0;
		min-width: 0;
	}
	.layout-1 {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}
	.layout-2 {
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
		align-items: stretch;
	}
	.layout-3 {
		grid-template-columns: 2fr 1fr;
		grid-template-rows: repeat(2, minmax(0, 1fr));
		height: 200px;
		align-items: stretch;
	}
	.layout-3 > * {
		min-height: 0;
	}
	.layout-3 button:first-child {
		grid-row: span 2;
	}
	.layout-4plus {
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		grid-auto-rows: 1fr;
		grid-auto-flow: dense;
		align-items: stretch;
	}
	.gallery img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
		display: block;
	}
</style>
