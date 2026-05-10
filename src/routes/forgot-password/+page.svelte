<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-md card bg-surface-100-900 p-8">
		<h1 class="mb-6 text-center h2">Reset Password</h1>

		{#if form?.success}
			<aside class="alert mb-4 preset-tonal-success p-4">
				<p>If that email exists, a reset link has been sent.</p>
			</aside>
		{:else}
			{#if form?.error}
				<aside class="alert mb-4 preset-tonal-error p-4">
					<p>{form.error}</p>
				</aside>
			{/if}

			<form method="POST" class="space-y-4">
				<label class="label">
					<span>Email</span>
					<input class="input" type="email" name="email" required placeholder="you@example.com" />
				</label>
				<button type="submit" class="btn w-full preset-filled-primary-500">
					Send Reset Link
				</button>
			</form>
		{/if}

		<p class="mt-4 text-center text-sm">
			<a href="/login" class="anchor">Back to login</a>
		</p>
	</div>
</div>
