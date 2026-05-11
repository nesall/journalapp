<script lang="ts">
	import { onMount } from 'svelte';
	import type { Note, TopicTag } from '$lib/types';
	import { formatDate, formatDateYYYYMMDD, moods } from '$lib/utils';
	import { slide } from 'svelte/transition';
	import Lightbox from '$lib/widgets/Lightbox.svelte';
	import TagPicker from '$lib/widgets/TagPicker.svelte';
	import BottomSheet from './BottomSheet.svelte';
	import FullNoteBox from './FullNoteBox.svelte';

	interface Props {
		note: Note;
		topicId: string;
		tags?: TopicTag[];
		autoEdit?: boolean;
		onMutate?: () => void;
	}

	let { note, topicId, tags = [], autoEdit = false, onMutate }: Props = $props();

	let interactiveMode = $state(false);
	let deleting = $state(false);
	let lightboxIndex = $state<number | null>(null);
	let fullMode = $state(false);

	onMount(() => {
		console.log('NoteBox Mounted', { note });
		if (autoEdit) {
			enterFullMode();
		}
	});

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

	function enterFullMode() {
		fullMode = true;
		interactiveMode = false;
	}

	$effect(() => {});
	$effect(() => {
		// if (autoEdit) enterEdit();
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
		<div class="flex-1 outline-none">
			{note.title}
		</div>
		{#if note.mood}
			<span class="ml-auto text-lg text-surface-500">{moods[note.mood - 1]}</span>
		{/if}
	</div>
	<hr class="hr" />
	{#if images.length > 0}
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

	{#if lightboxIndex !== null}
		<Lightbox
			{images}
			startIndex={lightboxIndex}
			onClose={() => (lightboxIndex = null)}
			title={note.title || 'Untitled'}
			date={note.entry_date}
		/>
	{/if}

	<button class="truncate-text px-0 text-left text-sm outline-none" onclick={enterFullMode}>
		{note.body}
	</button>
	<hr class="hr" />
	{#if interactiveMode}
		<div class="flex items-center gap-2" transition:slide>
			<button
				type="button"
				class="btn flex-1 preset-outlined-secondary-500 btn-sm"
				onclick={enterFullMode}
				disabled={deleting}
			>
				✏️ View / Edit
			</button>
			<button class="ml-auto btn flex-1 preset-filled-error-500 btn-sm" onclick={deleteNote}>
				{deleting ? '...' : '🗑️ Delete'}
			</button>
		</div>
	{/if}
	<div class="flex w-full flex-row items-center text-xs">
		<div class="flex items-center gap-4">
			<span>{formatDate(note.entry_date)}</span>
			{#if note.tag}
				<span
					class="flex items-center gap-1 rounded-full px-1 py-0.5 pr-2 text-xs text-white"
					style="background-color: {note.tag.color}"
				>
					<span>🏷️</span><span>{note.tag.name}</span>
				</span>
			{/if}
		</div>
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
	</div>
</div>

<!-- Full screen bottom sheet -->
<BottomSheet open={fullMode} onClose={() => (fullMode = false)}>
	<FullNoteBox
		{note}
		{topicId}
		{tags}
		onMutate={() => {
			fullMode = false;
			onMutate?.();
		}}
		onClose={() => (fullMode = false)}
	/>
</BottomSheet>

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
