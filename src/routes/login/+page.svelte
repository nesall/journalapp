<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-md card bg-surface-100-900 p-8">
		<h1 class="mb-6 text-center h2">Journal</h1>

		{#if form?.error}
			<aside class="alert preset-tonal-error mb-4">
				<p>{form.error}</p>
			</aside>
		{/if}

		<form method="POST" class="space-y-4">
			<label class="label">
				<span>Email</span>
				<input class="input" type="email" name="email" required placeholder="you@example.com" />
			</label>
			<label class="label">
				<span>Password</span>
				<input class="input" type="password" name="password" required />
			</label>
			<button type="submit" class="preset-filled-primary-500 btn w-full">Login</button>
		</form>

		<p class="mt-4 text-center text-sm">
			No account? <a href="/register" class="anchor">Register</a>
		</p>
	</div>
</div>
