<script lang="ts">
	import { pluralEnding } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedTopic = $state<string | null>(null);
	let selectedTag = $state<string>('');
	let format = $state<'zip' | 'html'>('html');
	let exporting = $state(false);

	const topicTags = $derived(
		selectedTopic ? data.tags.filter((t: any) => t.topic_id === selectedTopic) : []
	);

	function selectTopic(id: string) {
		selectedTopic = id;
		selectedTag = '';
	}

	async function doExport() {
		if (!selectedTopic) return;
		exporting = true;
		try {
			const params = new URLSearchParams({ topic: selectedTopic, format });
			if (selectedTag) params.set('tag', selectedTag);

			const res = await fetch(`/settings/export?${params}`);
			if (!res.ok) throw new Error('Export failed');

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download =
				res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ??
				`export.${format}`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Export failed', err);
		} finally {
			exporting = false;
		}
	}
</script>

<div class="mx-auto w-full max-w-lg space-y-6 p-6">
	<div class="flex items-center justify-between gap-2">
		<button class="btn preset-tonal-primary" onclick={() => history.back()}>&larr; Settings</button>
		<div class="h3 font-bold">Export</div>
	</div>
	<!-- Step 1: Topic -->
	<div class="space-y-3 card bg-surface-100-900 p-4">
		<h3 class="text-sm font-semibold tracking-wide text-surface-500 uppercase">1. Select Topic</h3>
		<div class="space-y-2">
			{#each data.topics as topic}
				<button
					type="button"
					class="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors
                        {selectedTopic === topic.id
						? 'bg-primary-500 text-white'
						: 'bg-surface-200-800 hover:bg-surface-300-700'}"
					onclick={() => selectTopic(topic.id)}
				>
					<span class="text-2xl">{topic.icon ?? '📓'}</span>
					<div class="flex-1">
						<p class="font-medium">{topic.name}</p>
						<p class="text-xs opacity-70">
							{topic.entry_count}
							{pluralEnding(Number(topic.entry_count), 'entry')}
						</p>
					</div>
					{#if selectedTopic === topic.id}
						<span>✓</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Step 2: Tag filter (optional) -->
	{#if selectedTopic && topicTags.length > 0}
		<div class="space-y-3 card bg-surface-100-900 p-4">
			<h3 class="text-sm font-semibold tracking-wide text-surface-500 uppercase">
				2. Filter by Tag <span class="font-normal normal-case">(optional)</span>
			</h3>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="btn btn-sm {selectedTag === '' ? 'preset-filled' : 'preset-outlined-surface-500'}"
					onclick={() => (selectedTag = '')}>All entries</button
				>
				{#each topicTags as tag}
					<button
						type="button"
						class="btn btn-sm text-white transition-all {selectedTag === tag.id
							? 'scale-105 ring-2 ring-success-400-600'
							: 'opacity-70 hover:opacity-100'}"
						style="background-color: {tag.color}"
						onclick={() => (selectedTag = selectedTag === tag.id ? '' : tag.id)}
						>{tag.name} ({tag.entry_count})</button
					>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Step 3: Format -->
	{#if selectedTopic}
		<div class="space-y-3 card bg-surface-100-900 p-4">
			<h3 class="text-sm font-semibold tracking-wide text-surface-500 uppercase">
				{topicTags.length > 0 ? '3' : '2'}. Format
			</h3>
			<div class="flex gap-3">
				<button
					type="button"
					class="btn flex-1 {format === 'html'
						? 'preset-filled-primary-500'
						: 'preset-outlined-surface-500'}"
					onclick={() => (format = 'html')}
				>
					🌐 HTML
				</button>
				<button
					type="button"
					class="btn flex-1 {format === 'zip'
						? 'preset-filled-primary-500'
						: 'preset-outlined-surface-500'}"
					onclick={() => (format = 'zip')}
				>
					📦 ZIP + Markdown
				</button>
			</div>
			<p class="text-xs text-surface-500">
				{#if format === 'html'}
					Single self-contained HTML file with embedded images. Open in any browser.
				{:else}
					ZIP archive with Markdown files and original images.
				{/if}
			</p>
		</div>

		<!-- Export button -->
		<button
			type="button"
			class="btn w-full preset-filled-primary-500"
			onclick={doExport}
			disabled={exporting}
		>
			{exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
		</button>
	{/if}
</div>
