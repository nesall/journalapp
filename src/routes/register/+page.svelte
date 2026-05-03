<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-md card bg-surface-100 p-8">
		<h1 class="mb-6 text-center h2">Create Account</h1>

		{#if form?.error}
			<aside class="alert preset-tonal-error mb-4">
				<p class='text-center'>{form.error}</p>
			</aside>
		{/if}

		<form method="POST" class="space-y-4">
			<label class="label">
				<span>Display Name</span>
				<input class="input" type="text" name="display_name" placeholder="Your name" />
			</label>
			<label class="label">
				<span>Email</span>
				<input class="input" type="email" name="email" required placeholder="you@example.com" />
			</label>
			<label class="label">
				<span>Password</span>
				<input
					class="input"
					type="password"
					name="password"
					required
					placeholder="Min 8 characters"
				/>
			</label>
			<button type="submit" class="preset-filled btn w-full">Register</button>
		</form>

		<p class="mt-4 text-center text-sm">
			Already have an account? <a href="/login" class="anchor">Login</a>
		</p>
	</div>
</div>
