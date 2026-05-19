<script lang="ts">
	import { themes, type ThemeId } from '$lib/theme';
	import { browser } from '$app/environment';

	let currentTheme = $state<ThemeId>(
		browser ? (localStorage.getItem('theme') as ThemeId) || 'cerberus' : 'cerberus'
	);
	let darkMode = $state(browser ? localStorage.getItem('dark') === 'true' : false);

	function setTheme(id: ThemeId) {
		currentTheme = id;
		localStorage.setItem('theme', id);
		document.documentElement.setAttribute('data-theme', id);
	}

	function toggleDark() {
		darkMode = !darkMode;
		localStorage.setItem('dark', String(darkMode));
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
</script>

<div class="space-y-4 card bg-surface-100-900 p-6">
	<h3 class="font-semibold">Appearance</h3>

	<!-- Dark mode toggle -->
	<div class="flex items-center justify-between">
		<span class="text-sm">Dark Mode</span>
		<button
			type="button"
			class="btn btn-sm {darkMode ? 'preset-filled-primary-500' : 'preset-outlined-surface-500'}"
			onclick={toggleDark}
		>
			{darkMode ? '🌙 On' : '☀️ Off'}
		</button>
	</div>

	<!-- Theme picker -->
	<div>
		<p class="mb-2 text-sm">Theme</p>
		<div class="grid grid-cols-2 gap-2">
			{#each themes as theme}
				<button
					type="button"
					class="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors
                        {currentTheme === theme.id
						? 'bg-primary-500 text-white'
						: 'bg-surface-200-800 hover:bg-surface-300-700'}"
					onclick={() => setTheme(theme.id)}
					data-theme={theme.id}
				>
					<span>{theme.emoji}</span>
					<span>{theme.label}</span>
					{#if currentTheme === theme.id}
						<span class="ml-auto">✓</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>
