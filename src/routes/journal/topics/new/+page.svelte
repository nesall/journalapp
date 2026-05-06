<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();

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
	let selectedEmoji = $state('📓');
</script>

<div class="mx-auto w-full max-w-md p-6">
	<h2 class="mb-6 h3">New Topic</h2>

	{#if form?.error}
		<aside class="alert mb-4 preset-tonal-error">
			<p>{form.error}</p>
		</aside>
	{/if}

	<form method="POST" class="space-y-4">
		<label class="label">
			<span>Topic Name</span>
			<input
				class="input"
				type="text"
				name="name"
				required
				placeholder="e.g. Health, Cars, Travel"
			/>
		</label>

		<div class="label">
			<span>Icon</span>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each emojis as emoji}
					<button
						type="button"
						class="rounded-lg p-2 text-2xl transition-colors {selectedEmoji === emoji
							? 'bg-primary-500'
							: 'bg-surface-200-800 hover:bg-surface-300-700'}"
						onclick={() => (selectedEmoji = emoji)}>{emoji}</button
					>
				{/each}
			</div>
			<input type="hidden" name="icon" value={selectedEmoji} />
		</div>

		<div class="flex gap-3 pt-2">
			<a href="/journal" class="btn flex-1 preset-tonal-primary">Cancel</a>
			<button type="submit" class="btn flex-1 preset-filled-primary-500">Create</button>
		</div>
	</form>
</div>
