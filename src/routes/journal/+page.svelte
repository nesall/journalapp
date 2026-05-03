<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

{#if data.topics.length === 0}
	<div class="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
		<p class="text-lg text-surface-500">No topics yet.</p>
		<a href="/journal/topics/new" class="preset-filled-primary-500 btn">Create your first topic</a>
	</div>
{:else}
	<div class="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4">
		{#each data.topics as topic}
			<a
				href="/journal/{topic.id}"
				class="flex flex-col items-center gap-2 card bg-surface-100 p-6 transition-colors hover:bg-surface-200"
			>
				<span class="text-4xl">{topic.icon ?? '📓'}</span>
				<span class="font-medium">{topic.name}</span>
			</a>
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
