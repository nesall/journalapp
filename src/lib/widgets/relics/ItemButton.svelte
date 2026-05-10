<script lang="ts">
	import Button from './Button.svelte';
	interface Props {
		text: string;
		size?: string;
		className?: string;
		onclick: () => any;
		children?: import('svelte').Snippet;
	}
	let {
		text = 'Menu item',
		size = 'md',
		className = '',
		onclick = () => {},
		children
	}: Props = $props();
	// const SLOTS = $$props.$$slots;
</script>

{#if children}
	<Button {onclick} {text} {className} fullWidth={true} variant="none" justify="left" {size}>
		{@render children?.()}
	</Button>
{:else}
	<Button {onclick} {text} {className} fullWidth={true} variant="none" justify="left" {size} />
{/if}