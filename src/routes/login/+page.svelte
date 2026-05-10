<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-md card bg-surface-100-900 p-8">
		<h1 class="mb-6 text-center h2">Journal</h1>

		{#if form?.error}
			<aside class="alert mb-4 preset-tonal-error">
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
			<button type="submit" class="btn w-full preset-filled-primary-500">Login</button>
		</form>

		<div class="mt-4 text-center text-sm flex flex-col gap-4">
			<a href="/forgot-password" class="anchor">Forgot password?</a>
			<div>No account? <a href="/register" class="anchor">Register</a></div>
		</div>
	</div>
</div>
