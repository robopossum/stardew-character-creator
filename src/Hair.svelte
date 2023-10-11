<script>
    import { afterUpdate, onMount } from "svelte";
    import { tint, getContext } from "./utils";

    export let id;
    export let color;
    export let hairSprite;
    export let hairFancySprite;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = getContext(canvasElement)

        hairSprite.callbacks.push(() => draw());
        hairFancySprite.callbacks.push(() => draw());
        draw();
    });

    afterUpdate(() => draw());

    const draw = () => {
        if (!ctx || !hairSprite.complete || !hairFancySprite.complete) {
            return;
        }

        const index = (id  || 1) - (id > 56 ? 57 : 1);
        const xOffset = (index % 8) * 16;
        const yOffset = parseInt(index / 8) * (id > 56 ? 128 : 96);

        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(id > 56 ? hairFancySprite : hairSprite, xOffset, yOffset, 16, 32, 64, id > 56 ? 0 : 8, 128, 256);

        let hex = color || '#c15b32"';
        tint(ctx, hex);
    };
</script>

<canvas bind:this={canvasElement} width=256 height=256/>

<style>
    canvas {
        position: absolute;
    }
</style>
