<script type="ts">
    import type { BulletPoint } from "../lib/appState";
    import { createEventDispatcher } from 'svelte';
    import type { BulletPointEvent } from "../lib/componentMessages";

    let dispatch = createEventDispatcher<BulletPointEvent>();
    export let bulletPoint: BulletPoint;
    export let isLockedBy: string;
    export let isLocked: boolean;

    let onTextChange = (e) => dispatch ("message", { type: "edit", text: e.target.value, bulletPointId: bulletPoint.bulletPointId });
    let unlock = () => dispatch ("message", { type: "unlock", bulletPointId: bulletPoint.bulletPointId });
    let lock = () => dispatch("message", { type: "lock", bulletPointId: bulletPoint.bulletPointId });


    import { onMount, afterUpdate } from 'svelte';
    let inputNode: HTMLInputElement;
    onMount(() => {
        inputNode?.focus();
    });

    afterUpdate(() => {
        inputNode?.focus();
    });
</script>

{#if !isLocked}
    <div>
        <input type="text" bind:this={inputNode} bind:value={bulletPoint.text} on:input={onTextChange} on:blur={unlock} />
    </div>
{:else}
    <div style="min-width: 30px; min-height: 14px;" on:click={lock}>
        <p>{bulletPoint.text}</p>
        {#if isLockedBy}<p>Locked by: {isLockedBy}</p>{/if}
    </div>
{/if}