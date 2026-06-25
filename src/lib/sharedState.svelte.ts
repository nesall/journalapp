
import { createToaster } from '@skeletonlabs/skeleton-svelte';

export const searchState = $state<{ nofHits: number | null }>({ nofHits: null });

export const toaster = createToaster();