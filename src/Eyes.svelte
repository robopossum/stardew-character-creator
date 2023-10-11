<script>
    import { afterUpdate, onMount } from "svelte";
    import { tint, getContext } from "./utils";

    export let color;
    export let eyeSprite;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = getContext(canvasElement)

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
