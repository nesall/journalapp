<script lang="ts">
	import { nextRandomId } from '$lib/utils';
	// import { createEventDispatcher } from 'svelte';
	// const dispatch = createEventDispatcher<{ toggle: boolean }>();
	const id = nextRandomId(6);
	interface Props {
		disabled?: boolean;
		checked?: boolean | null;
		toggle?: (b: boolean) => any;
		children?: import('svelte').Snippet;
		[key: string]: any;
	}

	let {
		disabled = false,
		checked = $bindable(false),
		toggle = (b: boolean) => {},
		children,
		...rest
	}: Props = $props();
	function onChange(e: Event) {
		// dispatch('toggle', (e.target as HTMLInputElement).checked);
		toggle((e.target as HTMLInputElement).checked);
	}
</script>

<div class="checkbox-wrapper">
	<input
		type="checkbox"
		{id}
		class="checkbox {disabled && 'pointer-events-none'}"
		onchange={onChange}
		bind:checked
		{...rest}
		{disabled}
	/>
	<label for={id} class="pl-1 {disabled && 'text-surface-500-400-token'}"
		>{@render children?.()}</label
	>
</div>

<style>
	.checkbox-wrapper {
		display: flex;
		align-items: center;
	}
	/* label {
		padding-left: 4px;
	} */
	.checkbox {
		width: 0.9rem;
		height: 0.9rem;
	}
</style>
