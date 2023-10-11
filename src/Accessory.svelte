<script>
    import { afterUpdate, onMount } from "svelte";
    import { tint } from "./utils";

    export let id;
    export let hairColor;
    export let accessorySprite;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = canvasElement.getContext("2d")

        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        accessorySprite.callbacks.push(() => draw());
        draw();
    });

    afterUpdate(() => draw());

    const draw = () => {
        if (!ctx || !accessorySprite.complete) {
            return;
        }

        ctx.clearRect(0, 0, 256, 256);

        const index = id - 2;
        if (index < 0) {
          return;
        }

        const xOffset = (index % 8) * 16;
        const yOffset = parseInt(index / 8) * 32;

        ctx.drawImage(accessorySprite, xOffset, yOffset, 16, 16, 64, 16, 128, 128);
        if (index < 6) {
          tint(ctx, hairColor);
        }
    };
</script>

<canvas bind:this={canvasElement} width=256 height=256/>

<style>
    canvas {
        position: absolute;
    }
</style>
