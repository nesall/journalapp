<script lang="ts">
	import type { TopicTag } from '$lib/types';
	import { nextRandomId } from '$lib/utils';

	interface Props {
		tags: TopicTag[];
		selectedTagId?: string | null;
		onChange: (tagId: string | null, tagName: string | null, tagColor: string | null) => void;
	}

	let { tags, selectedTagId = null, onChange }: Props = $props();

	const colors = [
		'#6366f1',
		'#ec4899',
		'#f59e0b',
		'#10b981',
		'#3b82f6',
		'#ef4444',
		'#8b5cf6',
		'#14b8a6',
		'#f97316'
	];

	let input = $state('');
	let focused = $state(false);
	let selectedColor = $state(colors[0]);

	// init input from selected tag
	$effect(() => {
		if (selectedTagId) {
			console.log('selectedTagId', { selectedTagId, tags });
			const tag = tags.find((t) => t.id === selectedTagId);
			if (tag) input = tag.name;
		}
	});

	const suggestions = $derived(
		input.trim() ? tags.filter((t) => t.name.toLowerCase().includes(input.toLowerCase())) : tags
	);

	const isNew = $derived(
		input.trim().length > 0 &&
			!tags.some((t) => t.name.toLowerCase() === input.trim().toLowerCase())
	);

	function select(tag: TopicTag) {
		input = tag.name;
		focused = false;
		onChange(tag.id, null, null);
	}

	function confirmNew() {
		if (!input.trim()) return;
		focused = false;
		onChange(null, input.trim(), selectedColor);
	}

	function clear() {
		input = '';
		onChange(null, null, null);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (suggestions.length === 1) select(suggestions[0]);
			else if (isNew) confirmNew();
		}
		if (e.key === 'Escape') {
			focused = false;
		}
	}
</script>

<div class="relative w-full">
	<div class="flex items-center gap-1">
		<!-- Selected tag badge or input -->
		{#if selectedTagId && !focused}
			{@const tag = tags.find((t) => t.id === selectedTagId)}
			{#if tag}
				<button
					type="button"
					class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white"
					style="background-color: {tag.color}"
					onclick={() => {
						focused = true;
					}}
				>
					{tag.name}
					<span
						role="button"
						tabindex="0"
						class="opacity-70 hover:opacity-100"
						onclick={(e) => {
							e.stopPropagation();
							clear();
						}}
						onkeydown={(e) => e.key === 'Enter' && clear()}>✕</span
					>
				</button>
			{/if}
		{:else}
			<input
				type="text"
				id="tagInput_{nextRandomId(5)}"
				class="input-sm input w-32 flex-1 text-xs"
				placeholder="Add tag..."
				bind:value={input}
				onfocus={() => (focused = true)}
				onblur={() => setTimeout(() => (focused = false), 150)}
				onkeydown={onKeydown}
			/>
			<div class="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
				{#if input}
					<button
						type="button"
						class="text-xs text-surface-400 hover:text-surface-600"
						onclick={clear}>✕</button
					>
				{/if}
				<span>🏷️</span>
			</div>
		{/if}
	</div>

	<!-- Dropdown -->
	{#if focused && (suggestions.length > 0 || isNew)}
		<div
			class="absolute top-full left-8 z-10 mt-1 w-48 rounded-lg border border-surface-300 bg-surface-50 shadow-lg"
		>
			{#each suggestions as tag}
				<button
					type="button"
					class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-200"
					onmousedown={() => select(tag)}
				>
					<span class="h-3 w-3 shrink-0 rounded-full" style="background-color: {tag.color}"></span>
					{tag.name}
				</button>
			{/each}

			<!-- Create new -->
			{#if isNew}
				<div class="space-y-2 border-t border-surface-300 p-2">
					<p class="text-xs text-surface-500">Create <strong>"{input.trim()}"</strong></p>
					<div class="flex flex-wrap gap-1">
						{#each colors as color}
							<button
								type="button"
								class="h-5 w-5 rounded-full transition-transform {selectedColor === color
									? 'scale-125 ring-2 ring-surface-400'
									: ''}"
								style="background-color: {color}"
								aria-label="Select {color} as tag color"
								onmousedown={(e) => {
									e.preventDefault();
									selectedColor = color;
								}}
							></button>
						{/each}
					</div>
					<button
						type="button"
						class="btn w-full preset-filled-primary-500 btn-sm text-xs"
						onmousedown={confirmNew}>+ Create tag</button
					>
				</div>
			{/if}
		</div>
	{/if}
</div>
