<script lang="ts">
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<!-- Top nav -->
	<header class="bg-surface-100-900 border-surface-300 flex items-center justify-between border-b px-4 py-3">
		<h1 class="h3 font-bold">Journal</h1>
		<div class="flex items-center gap-3">
			<span class="text-surface-600 text-sm">{data.user.display_name ?? data.user.email}</span>
			<form method="POST" action="/logout">
				<button type="submit" class="btn btn-sm preset-tonal-primary">Logout</button>
			</form>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex flex-1 flex-col">
		{@render children()}
	</main>
</div>