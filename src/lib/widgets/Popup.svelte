<script lang="ts">
	// import NamedIcon from './NamedIcon.svelte';
	import { initResizeObserver, isPtInRect, nextRandomId } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import ItemButton from './ItemButton.svelte';
	import Checkbox from './Checkbox.svelte';

	interface PopupItem {
		title: string;
		val: any;
		checkable?: boolean;
		checked?: boolean;
		icon?: string;
		radio?: string;
		id?: string;
	}

	function valueTitle(v: string | PopupItem) {
		if (typeof v === 'string') return v;
		return v.title;
	}
	function valueStr(v: string | PopupItem) {
		if (typeof v === 'string') return v;
		return v.val;
	}
	function iconName(v: string | PopupItem) {
		if (typeof v === 'string') return '';
		// console.log('v.icon', v.icon + '');
		return v.icon ? v.icon : '';
	}
	function isCheckable(v: string | PopupItem) {
		if (typeof v === 'string') return false;
		return v.checkable;
	}
	function isChecked(v: string | PopupItem) {
		if (typeof v === 'string') return false;
		return v.checked;
	}
	function radioName(v: string | PopupItem) {
		if (typeof v === 'string') return '';
		return v.radio ? v.radio : '';
	}
	function radioId(v: string | PopupItem) {
		if (typeof v === 'string') return '';
		return v.id;
	}

  function textToIconSynbol(text: string) {
    const map: Record<string, string> = {
      'edit': '✏️',
      'trashcan': '🗑️',
    };
    return map[text] || '';
  }

	interface Props {
		values?: Array<string | PopupItem>;
		id?: string;
		className?: string;
		disabled?: boolean;
		click: (s: string) => any;
		toggle?: (s: string, b: boolean) => any;
		dropdownRequest?: () => any;
	}

	let {
		values = [] as Array<string | PopupItem>,
		id = nextRandomId(5),
		className = '',
		disabled = false,
		click,
		toggle,
		dropdownRequest = () => {}
	}: Props = $props();

	export function isDropdownVisible() {
		return show;
	}
	export function isPointInDropbdown(x: number, y: number) {
		return isPtInRect(elemFloat.getBoundingClientRect(), x, y);
	}

	let show = $state(false);
	function onClick() {
		show = !show;
		if (show) dropdownRequest();
	}

	function windowPressed(e: MouseEvent) {
		if (
			!isPtInRect(elemFloat.getBoundingClientRect(), e.clientX, e.clientY) &&
			!isPtInRect(elemAnchor.getBoundingClientRect(), e.clientX, e.clientY)
		) {
			show = false;
		}
	}
	function windowClicked(e: MouseEvent) {}
	function windowKeyDown(e: KeyboardEvent) {
		switch (e.key) {
			case 'Escape':
				break;
		}
	}

	function onItemClick(v: string) {
		const f = values?.find((v) => {
			if (typeof v != 'string') if (v.radio) return true;
			return false;
		});
		if (!f) show = false;
		click(v);
	}

	function onItemToggle(b: boolean, v: string) {
		if (toggle) toggle(v, b);
	}

	let elemFloat: HTMLElement;
	let elemAnchor: HTMLElement;
	let delAutoUpdate: any;
	function recomputePosition() {
		delAutoUpdate = autoUpdate(elemAnchor, elemFloat, () => {
			if (elemFloat)
				computePosition(elemAnchor, elemFloat, {
					placement: 'bottom',
					middleware: [offset(4), flip(), shift({ padding: 4 })]
				}).then(({ x, y }) => {
					if (elemFloat)
						Object.assign(elemFloat.style, {
							left: `${x}px`,
							top: `${y}px`
						});
				});
		});
	}

	onMount(() => {
		initResizeObserver(elemAnchor, () => {
			if (delAutoUpdate) delAutoUpdate();
			if (elemAnchor) {
				recomputePosition();
			}
		});
		recomputePosition();
	});
	onDestroy(() => {
		delAutoUpdate();
	});

	let display = $derived(show ? 'display: block' : 'display: none');
</script>

<div class="{className} popup popup-wrapper {id}" bind:this={elemAnchor}>
	<div class="flex items-center w-full h-full">
		<button type="button" class="btn p-0 hover:text-primary-700!" onclick={onClick} id="{id}_btn" {disabled}>
			<!-- <NamedIcon name="dots-h" /> -->
       &#8942;
		</button>
	</div>
</div>

<div class="card shadow-lg p-2 dropdown" style="{display};" bind:this={elemFloat}>
	<nav class="list-nav p-0">
		<ul>
			{#each values as v}
				<li class="flex items-center">
					{#if !valueStr(v)}
						<hr class="w-full" />
					{:else if isCheckable(v)}
						<Checkbox size="sm" checked={isChecked(v)} toggle={(b) => onItemToggle(b, valueStr(v))}>
							{valueTitle(v)}
						</Checkbox>
					{:else if radioName(v)}
						<div class="radio-wrapper">
							<input
								type="radio"
								class="radio radio-sm w-[0.9rem] h-[0.9rem]"
								name={radioName(v)}
								id={radioId(v)}
								checked={isChecked(v)}
								onclick={() => onItemClick(valueStr(v))}
							/>
							<label for={radioId(v)} class="pl-1">{valueTitle(v)}</label>
						</div>
					{:else}
						<ItemButton
							size="sm"
							onclick={() => onItemClick(valueStr(v))}
							text={valueTitle(v)}
							className="pl-0"
						>
							{#if iconName(v)}
                <span style="font-size: 0.9em">{textToIconSynbol(iconName(v))}</span>
							{/if}
						</ItemButton>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
</div>

<svelte:window onclick={windowClicked} onmousedown={windowPressed} onkeydown={windowKeyDown} />

<style>
	.dropdown {
		position: absolute;
		left: 0;
		top: 0;
		z-index: 50;
	}
	.card {
		margin-top: 0px !important;
		font-size: 0.94em;
	}

	:global(.list-nav .checkbox-wrapper) {
		/* TOTHINK: move to global app.postcss*/
		display: flex;
		align-items: center;
		padding-left: 1rem;
		padding-right: 1rem;
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
	}
	:global(.list-nav .radio-wrapper) {
		display: flex;
		align-items: center;
		padding-left: 1rem;
		padding-right: 1rem;
	}
</style>
