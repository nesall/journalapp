<script lang="ts">
	import type { Note, TopicTag } from '$lib/types';
	import { formatDate, moods, nextRandomId } from '$lib/utils';
	import { tick } from 'svelte';
	import Lightbox from './Lightbox.svelte';
	import TagPicker from './TagPicker.svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { toaster } from '$lib/sharedState.svelte';

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
	let editableMedia = $state([...note.media].map((m, i) => ({ ...m, sort_order: i })));

	let lightboxIndex = $state<number | null>(null);

	const images = $derived(note.media ?? []);

	const textareaId = 'fullnote-textarea-' + nextRandomId(8);
	const flipDurationMs = 150;

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
			// document.getElementById(textareaId)?.focus();
		});
	}

	function cancelEdit() {
		editMood = note.mood ?? 0;
		editDate = note.entry_date;
		editTagId = note.tag_id ?? null;
		editMode = false;
	}

	async function saveEdit() {
		// if (!editBody.trim()) {
		// 	await deleteNote();
		// 	return;
		// }

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
			await saveMediaOrder();
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

	$effect(() => {
		if (autoEdit) enterEdit();
	});

	async function uploadImageFile(file: File) {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('entry_id', note.id);

		const res = await fetch(`/journal/${topicId}/media`, {
			method: 'POST',
			body: formData
		});
		if (res.ok) onMutate?.();
		else console.error('Image upload failed', await res.text());
	}

	async function handlePaste() {
		try {
			const items = await navigator.clipboard.read();
			for (const item of items) {
				const imageType = item.types.find((t) => t.startsWith('image/'));
				if (!imageType) continue;

				const blob = await item.getType(imageType);
				const file = new File([blob], 'paste.png', { type: imageType });

				await uploadImageFile(file);
				return; // only handle first image
			}
			alert('No image found in clipboard');
		} catch (err) {
			// fallback — listen for paste event on the document
			console.warn('Clipboard API failed, try Ctrl+V instead:', err);
			alert('Could not read clipboard. Try Ctrl+V while focused on the note.');
		}
	}

	async function onGlobalPaste(e: ClipboardEvent) {
		if (!editMode) return;
		const items = Array.from(e.clipboardData?.items ?? []);
		const imageItem = items.find((i) => i.type.startsWith('image/'));
		if (!imageItem) return;

		e.preventDefault();
		const file = imageItem.getAsFile();
		if (!file) return;

		await uploadImageFile(file);
	}

	$effect(() => {
		editableMedia = [...note.media].map((m, i) => ({ ...m, sort_order: i }));
	});

	function handleDndConsider(e: CustomEvent) {
		editableMedia = e.detail.items;
	}

	async function handleDndFinalize(e: CustomEvent) {
		editableMedia = e.detail.items;
		// await saveMediaOrder();
	}

	async function saveMediaOrder() {
		const order = editableMedia.map((m, i) => ({ id: m.id, sort_order: i }));
		await fetch(`/journal/${topicId}/media/order`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ order })
		});
		onMutate?.();
	}
</script>

<svelte:window onpaste={onGlobalPaste} />

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
			<div
				class="flex items-center gap-2 overflow-auto py-4"
				use:dndzone={{
					items: editableMedia,
					flipDurationMs,
					dragDisabled: editableMedia.length === 0,
					delayTouchStart: 150
				}}
				onconsider={handleDndConsider}
				onfinalize={handleDndFinalize}
			>
				{#each editableMedia as media (media.id)}
					<div class="group relative" animate:flip={{ duration: flipDurationMs }}>
						<img
							src={media.url}
							alt="media"
							class="pointer-events-none h-24 w-20 min-w-16 rounded object-cover"
						/>
						<!-- <div
							data-dnd-handle
							class="absolute right-0 bottom-0 left-0 flex cursor-grab items-center
                       justify-center rounded-b bg-black/40 py-0.5 text-xs text-white"
						>
							⠿
						</div> -->
						<button
							type="button"
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full
                               bg-error-500 text-xs text-white transition-opacity group-hover:opacity-100 lg:opacity-0"
							onclick={() => removeImage(media.id)}>✕</button
						>
					</div>
				{/each}
			</div>
			<div class="flex items-center gap-2">
				<label
					class="flex h-16 w-16
								cursor-pointer items-center justify-center rounded border-2 border-dashed
								border-surface-400-600 text-3xl transition-colors hover:border-primary-500 hover:text-primary-500"
				>
					<input type="file" accept="image/*" class="hidden" onchange={handleImageUpload} />
					📎
				</label>
				<button
					type="button"
					class="flex h-16 w-16
               items-center justify-center rounded border-2 border-dashed
               border-surface-400-600 text-3xl transition-colors hover:border-primary-500 hover:text-primary-500"
					onclick={handlePaste}
					title="Paste image from clipboard"
				>
					📋
				</button>
			</div>
		</div>
	{:else if images.length > 0}
		<div class="mb-4 flex gap-2 overflow-x-auto">
			{#each images as media, i}
				<button type="button" class="m-0 p-0" onclick={() => (lightboxIndex = i)}>
					<img
						src={media.url}
						alt="media"
						class="aspect-square h-24 min-w-16 cursor-pointer rounded object-cover"
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
		<hr class="my-2 hr" />
		<div class="relative min-h-0 flex-1 overflow-auto text-sm leading-relaxed whitespace-pre-wrap">
			<button
				type="button"
				class="sticky top-2 float-right btn h-8 w-8 preset-outlined-surface-300-700"
				title="Copy note content"
				onclick={() => {
					navigator.clipboard.writeText(note.body);
					toaster.info({ title: 'Copied', description: 'Note content copied to clipboard.' });
				}}
			>
				📋
			</button>{note.body}<!-- if too long a scrollbar will be shown-->
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
