<script>
    import { afterUpdate, onMount } from "svelte";
    import { tint } from "./utils";

    export let color;
    export let eyeSprite;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = canvasElement.getContext("2d")

        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        eyeSprite.onload = () => draw();
        draw();
    });

    afterUpdate(() => draw());

    const draw = () => {
        if (!ctx || !eyeSprite.complete) {
            return;
        }

        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(eyeSprite, 0, 0, 16, 32, 64, 0, 128, 256);
       
        let hex = color || '#7a4434';

        tint(ctx, hex);
    };
</script>

<canvas bind:this={canvasElement} width=256 height=256/>

<style>
    canvas {
        position: absolute;
    }
</style>
