<script lang="ts">
	let {
		text = 'Click',
		size = 'sm',
		variant = 'filled',
		bold = false,
		fullWidth = false,
		disabled = false,
		justify = 'auto',
		className = '',
		children = null,
		onclick,
		...restProps
	} = $props();
	// export let onclick = () => {};
	// const SLOTS = $$props.$$slots;

	let cls = $derived(
		`btn btn-${size} variant-${variant} ${bold ? ' bold' : ''} ${
			fullWidth ? ' w-full' : ''
		} justify-${justify}`
	);
</script>

{#if children}
	<button class={cls + ' ' + className} {onclick} {disabled} {...restProps}>
		<span>{@render children?.()}</span>
		<span>{text}</span>
	</button>
{:else}
	<button class={cls} {onclick} {disabled} {...restProps}>{text}</button>
{/if}

<style>
	.bold {
		font-weight: bold;
	}
	.justify-left {
		justify-content: start;
	}
</style>
