<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import '../routes/layout.css';
	import { goto } from '$app/navigation';

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
