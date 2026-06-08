<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { moods } from '$lib/utils';
	import Chart from 'chart.js/auto';

	let { data }: { data: PageData } = $props();

	let monthChartEl = $state<HTMLCanvasElement | null>(null);
	let moodChartEl = $state<HTMLCanvasElement | null>(null);

	const totalWords = Math.round(parseInt(data.totals.total_chars) / 5); // rough word estimate

	onMount(() => {
		// entries per month chart
		if (monthChartEl && data.entriesPerMonth.length > 0) {
			new Chart(monthChartEl, {
				type: 'bar',
				data: {
					labels: data.entriesPerMonth.map((r: any) => {
						const [year, month] = r.month.split('-');
						return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
							month: 'short',
							year: '2-digit'
						});
					}),
					datasets: [
						{
							label: 'Entries',
							data: data.entriesPerMonth.map((r: any) => parseInt(r.count)),
							backgroundColor: 'rgba(99, 102, 241, 0.7)',
							borderRadius: 4
						}
					]
				},
				options: {
					responsive: true,
					plugins: { legend: { display: false } },
					scales: {
						y: { beginAtZero: true, ticks: { stepSize: 1 } }
					}
				}
			});
		}

		// mood distribution chart
		if (moodChartEl && data.moodDist.length > 0) {
			new Chart(moodChartEl, {
				type: 'doughnut',
				data: {
					labels: data.moodDist.map((r: any) => moods[parseInt(r.mood) - 1]),
					datasets: [
						{
							data: data.moodDist.map((r: any) => parseInt(r.count)),
							backgroundColor: [
								'rgba(239,68,68,0.7)',
								'rgba(249,115,22,0.7)',
								'rgba(234,179,8,0.7)',
								'rgba(34,197,94,0.7)',
								'rgba(99,102,241,0.7)'
							],
							borderWidth: 0
						}
					]
				},
				options: {
					responsive: true,
					plugins: {
						legend: { position: 'bottom' }
					}
				}
			});
		}
	});
</script>

<div class="mx-auto w-full max-w-lg space-y-6 p-6">
	<div class="flex items-center justify-between gap-2">
		<button class="btn preset-tonal-primary" onclick={() => history.back()}>&larr; Settings</button>
		<div class="h3 font-bold">Stats</div>
	</div>

	<!-- Totals -->
	<div class="grid grid-cols-2 gap-4">
		<div class="card bg-surface-100-900 p-4 text-center">
			<p class="text-3xl font-bold text-primary-500">{data.totals.topic_count}</p>
			<p class="text-sm text-surface-500">Topics</p>
		</div>
		<div class="card bg-surface-100-900 p-4 text-center">
			<p class="text-3xl font-bold text-primary-500">{data.totals.entry_count}</p>
			<p class="text-sm text-surface-500">Entries</p>
		</div>
		<div class="card bg-surface-100-900 p-4 text-center">
			<p class="text-3xl font-bold text-primary-500">{data.totals.image_count}</p>
			<p class="text-sm text-surface-500">Images</p>
		</div>
		<div class="card bg-surface-100-900 p-4 text-center">
			<p class="text-3xl font-bold text-primary-500">{totalWords.toLocaleString()}</p>
			<p class="text-sm text-surface-500">Words written</p>
		</div>
	</div>

	<!-- Avg words per entry -->
	<div class="card bg-surface-100-900 p-4 text-center">
		<p class="text-3xl font-bold text-primary-500">{data.avgWords}</p>
		<p class="text-sm text-surface-500">Avg words per entry</p>
	</div>

	<!-- Entries per month -->
	<div class="space-y-3 card bg-surface-100-900 p-4">
		<h3 class="font-semibold">Entries per month</h3>
		{#if data.entriesPerMonth.length > 0}
			<canvas bind:this={monthChartEl}></canvas>
		{:else}
			<p class="text-sm text-surface-500">No data yet.</p>
		{/if}
	</div>

	<!-- Topic activity -->
	<div class="space-y-3 card bg-surface-100-900 p-4">
		<h3 class="font-semibold">Topics</h3>
		<div class="space-y-2">
			{#each data.topicActivity as topic}
				{@const max = data.topicActivity[0].entry_count}
				<div class="flex items-center gap-3">
					<span class="w-6 text-center">{topic.icon ?? '📓'}</span>
					<div class="flex-1">
						<div class="mb-1 flex justify-between text-sm">
							<span>{topic.name}</span>
							<span class="text-surface-500">{topic.entry_count}</span>
						</div>
						<div class="h-2 rounded-full bg-surface-300">
							<div
								class="h-2 rounded-full bg-primary-500"
								style="width: {max > 0 ? (topic.entry_count / max) * 100 : 0}%"
							></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Mood distribution -->
	{#if data.moodDist.length > 0}
		<div class="space-y-3 card bg-surface-100-900 p-4">
			<h3 class="font-semibold">Mood distribution</h3>
			<div class="mx-auto max-w-62">
				<canvas bind:this={moodChartEl}></canvas>
			</div>
		</div>
	{/if}

	{#if data.tagDist.length > 0}
		<div class="space-y-3 card bg-surface-100 p-4">
			<h3 class="font-semibold">Tags distribution</h3>
			<div class="space-y-2">
				{#each data.tagDist as tag}
					{@const max = data.tagDist[0].count}
					<div class="flex items-center gap-3">
						<span
							class="shrink-0 rounded-full px-2 py-0.5 text-xs text-white"
							style="background-color: {tag.color}">{tag.name}</span
						>
						<div class="flex-1">
							<div class="h-2 rounded-full bg-surface-300">
								<div
									class="h-2 rounded-full"
									style="width: {max > 0
										? (tag.count / max) * 100
										: 0}%; background-color: {tag.color}"
								></div>
							</div>
						</div>
						<span class="shrink-0 text-xs text-surface-500">{tag.count}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
