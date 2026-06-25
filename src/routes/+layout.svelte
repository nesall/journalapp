<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import '../routes/layout.css';
	import { goto } from '$app/navigation';
	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/sharedState.svelte';

	let { children } = $props();
	let interval: ReturnType<typeof setInterval>;

	const exludedPaths = ['/login', '/signup'];

	onMount(() => {
		interval = setInterval(
			async () => {
				if (exludedPaths.includes(window.location.pathname)) return;
				const res = await fetch('/api/session');
				console.log('layout.svelte - Session check', res);
				if (res.status === 401) goto('/login');
			},
			5 * 60 * 1000
		);
	});

	onDestroy(() => clearInterval(interval));
</script>

{@render children()}

<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast toast={toast}>
			<Toast.Message>
			<Toast.Title>{toast.title}</Toast.Title>
			<Toast.Description>{toast.description}</Toast.Description>
			</Toast.Message>
			<Toast.CloseTrigger />
		</Toast>
	{/snippet}
</Toast.Group>