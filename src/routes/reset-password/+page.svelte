<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-md card bg-surface-100-900 p-8">
		<h1 class="mb-6 text-center h2">New Password</h1>

		{#if data.invalid}
			<aside class="alert mb-4 preset-tonal-error p-4">
				<p>This reset link is invalid or has expired.</p>
			</aside>
			<a href="/forgot-password" class="btn w-full preset-filled-primary-500"> Request new link </a>
		{:else}
			{#if form?.error}
				<aside class="alert mb-4 preset-tonal-error p-4">
					<p>{form.error}</p>
				</aside>
			{/if}

			<form method="POST" class="space-y-4">
				<input type="hidden" name="token" value={data.token} />
				<label class="label">
					<span>New Password</span>
					<input
						class="input"
						type="password"
						name="password"
						required
						placeholder="Min 8 characters"
					/>
				</label>
				<label class="label">
					<span>Confirm Password</span>
					<input class="input" type="password" name="confirm" required />
				</label>
				<button type="submit" class="btn w-full preset-filled-primary-500"> Reset Password </button>
			</form>
		{/if}
	</div>
</div>
