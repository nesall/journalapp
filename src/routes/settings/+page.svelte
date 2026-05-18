<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { fade, fly, slide } from 'svelte/transition';
	import { tick } from 'svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showDeleteConfirm = $state(false);

	function onShowDeleteConfirm() {
		showDeleteConfirm = true;
		tick().then(() => {
			const input = document.getElementById('delete_confirm_password') as HTMLInputElement | null;
			input?.focus();
			const cancelButton = document.getElementById(
				'delete_confirm_cancel_button'
			) as HTMLButtonElement | null;
			cancelButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			console.log(
				'onShowDeleteConfirm: showDeleteConfirm=',
				showDeleteConfirm,
				'cancelButton=',
				cancelButton,
				'input=',
				input
			);
		});
	}
</script>

<div class="mx-auto w-full max-w-lg space-y-6 p-6">
	<div class="flex items-center justify-between gap-2">
		<button class="btn preset-tonal-primary" onclick={() => history.back()}>&larr;</button>
		<div class="h3 font-bold">Settings</div>
	</div>

	<!-- Display Name -->
	<div class="flex flex-col space-y-4 card bg-surface-100-900 p-4">
		<div class="text-lg font-bold">Profile</div>

		{#if form?.profileSuccess}
			<aside class="alert rounded preset-tonal-success p-2">
				<p>Display name updated.</p>
			</aside>
		{/if}
		{#if form?.profileError}
			<aside class="alert rounded preset-tonal-error p-2">
				<p>{form.profileError}</p>
			</aside>
		{/if}

		<form method="POST" action="?/updateProfile" class="space-y-4" use:enhance>
			<fieldset class="space-y-4">
				<label class="label">
					<span class="label-text">Display Name</span>
					<input
						class="input"
						type="text"
						name="display_name"
						value={data.user.display_name ?? ''}
						required
					/>
				</label>
				<label class="label">
					<span class="label-text">Email</span>
					<input class="input" type="email" name="email" value={data.user.email} disabled />
				</label>
			</fieldset>
			<fieldset class="flex">
				<button type="submit" class="ml-auto btn preset-filled-primary-500"> Save Changes </button>
			</fieldset>
		</form>
	</div>

	<!-- Change Password -->
	<div class="flex flex-col space-y-4 card bg-surface-100-900 p-4">
		<div class="text-lg font-bold">Change Password</div>

		{#if form?.passwordError}
			<aside class="alert rounded preset-tonal-error p-2">
				<p>{form.passwordError}</p>
			</aside>
		{/if}

		<form method="POST" action="?/changePassword" use:enhance class="space-y-4">
			<fieldset class="space-y-4">
				<label class="label">
					<span class="label-text">Current Password</span>
					<input class="input" type="password" name="current_password" required />
				</label>
				<label class="label">
					<span class="label-text">New Password</span>
					<input
						class="input"
						type="password"
						name="new_password"
						required
						placeholder="Min 8 characters"
					/>
				</label>
				<label class="label">
					<span class="label-text">Confirm New Password</span>
					<input class="input" type="password" name="confirm_password" required />
				</label>
			</fieldset>
			<fieldset class="flex">
				<button type="submit" class="ml-auto btn preset-filled-primary-500">
					Change Password
				</button>
			</fieldset>
		</form>
	</div>

	<!-- Tools section -->
	<div class="space-y-3 card bg-surface-100-900 p-6">
		<h3 class="font-semibold">Tools</h3>
		<div class="flex flex-col gap-2">
			<a href="/settings/stats" class="btn justify-start preset-outlined-surface-500">
				📊 Stats →
			</a>
			<a href="/settings/export" class="btn justify-start preset-outlined-surface-500">
				📦 Export →
			</a>
		</div>
	</div>

	<!-- Delete Account -->
	<div class="flex flex-col space-y-4 card bg-surface-100-900 p-4">
		<div class="text-lg font-bold text-error-500">Danger Zone</div>
		<p class="text-sm text-surface-500">
			Deleting your account is permanent. All topics, entries, and images will be deleted.
		</p>

		{#if form?.deleteError}
			<aside class="alert rounded preset-tonal-error p-2">
				<p>{form.deleteError}</p>
			</aside>
		{/if}

		{#if !showDeleteConfirm}
			<div class="flex">
				<button
					type="button"
					class="ml-auto btn preset-filled-error-500"
					onclick={onShowDeleteConfirm}
				>
					Delete Account
				</button>
			</div>
		{:else}
			<div class="space-y-4 rounded border border-error-500 bg-error-100 p-4">
				<form method="POST" action="?/deleteAccount" use:enhance class="space-y-4">
					<p class="text-sm font-medium">Enter your password to confirm:</p>
					<input
						class="input"
						type="password"
						name="delete_confirm_password"
						id="delete_confirm_password"
						required
						placeholder="Your password"
					/>
					<div class="flex flex-col gap-2">
						<button type="submit" class="btn flex-1 preset-filled-error-500">
							Yes, delete everything
						</button>
						<button
							type="button"
							class="btn flex-1 preset-outlined-surface-500"
							onclick={() => (showDeleteConfirm = false)}
							tabindex={0}
							id="delete_confirm_cancel_button"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
</div>
