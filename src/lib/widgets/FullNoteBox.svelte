<script lang="ts">
	import type { Note, TopicTag } from '$lib/types';
	import { formatDate, moods, nextRandomId } from '$lib/utils';
	import { tick } from 'svelte';
	import Lightbox from './Lightbox.svelte';
	import TagPicker from './TagPicker.svelte';

	interface Props {
		note: Note;
		topicId: string;
		tags?: TopicTag[];
		autoEdit?: boolean;
		onMutate?: () => void;
		onClose: () => void;
	}

	let { note, topicId, tags = [], autoEdit, onMutate, onClose }: Props = $props();

	let editMode = $state(false);
	let saving = $state(false);
	let deleting = $state(false);

	let editTitle = $state(note.title ?? '');
	let editBody = $state(note.body);
	let editMood = $state(note.mood ?? 0);
	let editDate = $state(note.entry_date);
	let editTagId = $state<string | null>(note.tag_id ?? null);
	let editTagName = $state<string | null>(null);
	let editTagColor = $state<string | null>(null);

	let lightboxIndex = $state<number | null>(null);

	const images = $derived(note.media ?? []);

	const textareaId = 'fullnote-textarea-' + nextRandomId(8);

	function enterEdit() {
		editTitle = note.title ?? '';
		editBody = note.body;
		editMood = note.mood ?? 0;
		editDate = note.entry_date;
		editTagId = note.tag_id ?? null;
		editTagName = null;
		editTagColor = null;
		editMode = true;
		tick().then(() => {
			document.getElementById(textareaId)?.focus();
		});
	}

	function cancelEdit() {
		editMood = note.mood ?? 0;
		editDate = note.entry_date;
		editTagId = note.tag_id ?? null;
		editMode = false;
	}

	async function saveEdit() {
		if (!editBody.trim()) {
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
					title: editTitle || null,
					body: editBody,
					mood: editMood || null,
					entry_date: editDate,
					tag_id: editTagId,
					tag_name: editTagName,
					tag_color: editTagColor,
					topic_id: topicId
				})
			});
			if (!res.ok) throw new Error(await res.text());
			onMutate?.();
			editMode = false;
		} catch (err) {
			console.error('Save failed', err);
		} finally {
			saving = false;
		}
	}

	async function deleteNote() {
		if (!confirm('Delete this note?')) return;
		deleting = true;
		try {
			const res = await fetch(`/journal/${topicId}/entries`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: note.id })
			});
			if (!res.ok) throw new Error(await res.text());
			onMutate?.();
			onClose();
		} catch (err) {
			console.error('Delete failed', err);
		} finally {
			deleting = false;
		}
	}

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
		editTagId = tagId;
		editTagName = tagName;
		editTagColor = tagColor;
	}

	// $effect(() => {
	// 	if (bodyEl && !editMode) bodyEl.innerText = note.body;
	// 	if (titleEl && !editMode) titleEl.innerText = note.title ?? '';
	// });
	$effect(() => {
		if (autoEdit) enterEdit();
	});
</script>

<div class="flex h-full w-full flex-col px-4 pt-2 pb-4">
	<!-- Top bar -->
	<div class="mb-3 flex items-center justify-between gap-2">
		{#if editMode}
			<button class="btn preset-outlined-secondary-500" onclick={cancelEdit} disabled={saving}>
				Cancel
			</button>
			<button class="btn preset-filled-primary-500" onclick={saveEdit} disabled={saving}>
				{saving ? '...' : '✓ Save'}
			</button>
		{:else}
			<div class="flex gap-2">
				<button class="btn preset-outlined-secondary-500" onclick={enterEdit}> ✏️ Edit </button>
			</div>
			<button type="button" class="btn preset-outlined-surface-500" onclick={onClose}>
				✕ Close
			</button>
		{/if}
	</div>

	<!-- Title -->
	{#if editMode}
		<input
			class="input mb-2 text-lg font-bold"
			type="text"
			placeholder="Title (optional)"
			bind:value={editTitle}
		/>
	{:else}
		<div class="mb-1 text-lg font-bold">{note.title ?? ''}</div>
	{/if}

	<!-- Meta: date + mood + tag -->
	<div class="mb-3 flex flex-wrap items-center gap-2 text-xs text-surface-500">
		{#if editMode}
			<input type="date" class="input-sm input text-xs" bind:value={editDate} />
			<div class="flex gap-1">
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
			<TagPicker {tags} selectedTagId={editTagId} onChange={onTagChange} />
		{:else}
			<span>{formatDate(note.entry_date)}</span>
			{#if note.mood}
				<span class="text-lg">{moods[note.mood - 1]}</span>
			{/if}
			{#if note.tag}
				<span
					class="rounded-full px-2 py-0.5 text-white"
					style="background-color: {note.tag.color}"
				>
					{note.tag.name}
				</span>
			{/if}
		{/if}
	</div>

	<!-- Images -->
	{#if editMode}
		<div class="mb-4 flex flex-wrap items-center gap-2">
			{#each images as media}
				<div class="group relative">
					<img src={media.url} alt="media" class="h-20 w-20 rounded object-cover" />
					<button
						type="button"
						class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full
                               bg-error-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
						onclick={() => removeImage(media.id)}>✕</button
					>
				</div>
			{/each}
			<label
				class="flex h-20 w-20
                          cursor-pointer items-center justify-center rounded border-2 border-dashed
                          border-surface-400 text-3xl transition-colors hover:border-primary-500 hover:text-primary-500"
			>
				<input type="file" accept="image/*" class="hidden" onchange={handleImageUpload} />
				+
			</label>
		</div>
	{:else if images.length > 0}
		<div
			class="mb-4 grid gap-2"
			style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr))"
		>
			{#each images as media, i}
				<button type="button" class="m-0 p-0" onclick={() => (lightboxIndex = i)}>
					<img
						src={media.url}
						alt="media"
						class="aspect-square w-full cursor-pointer rounded object-cover"
					/>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Body -->
	{#if editMode}
		<textarea
			id={textareaId}
			class="textarea min-h-48 w-full flex-1 resize-none text-sm leading-relaxed"
			placeholder="Write something..."
			bind:value={editBody}
		></textarea>
	{:else}
		<div class="min-h-0 flex-1 overflow-auto text-sm leading-relaxed whitespace-pre-wrap">
			{note.body}
		</div>
	{/if}

	{#if editMode}
		<button
			class="mt-2 ml-auto btn preset-filled-error-500 btn-sm"
			onclick={deleteNote}
			disabled={deleting}
		>
			{deleting ? '...' : '🗑️ Delete this entry'}
		</button>
	{/if}
</div>

<!-- Lightbox -->
{#if lightboxIndex !== null}
	<Lightbox {images} startIndex={lightboxIndex} onClose={() => (lightboxIndex = null)} />
{/if}
