<script>
    import { afterUpdate, onMount } from "svelte";
    import { tint } from "./utils";

    export let id;
    export let color;
    export let pantSprite;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = canvasElement.getContext("2d")

        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        pantSprite.callbacks.push(() => draw());
        draw();
    });

    afterUpdate(() => draw());

    const draw = () => {
        if (!ctx || !pantSprite.complete) {
            return;
        }

        let xOffset = ((id || 1) - 1) * 192;

        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(pantSprite, xOffset, 0, 16, 32, 64, 0, 128, 256);
       
        let hex = color || '#2e55b7';

        tint(ctx, hex);
    };
</script>

<canvas bind:this={canvasElement} width=256 height=256/>

<style>
    canvas {
        position: absolute;
    }
</style>
