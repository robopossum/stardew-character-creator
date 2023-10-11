<script>
    import { afterUpdate, onMount } from "svelte";
    import { getContext } from "./utils";

    export let id;
    export let sleeves;
    export let shirtSprite;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = getContext(canvasElement)

        shirtSprite.callbacks.push(() => draw());
        draw();
    });

    afterUpdate(() => draw());

    const draw = () => {
        if (!ctx || !shirtSprite.complete) {
            return;
        }

        let index = (id || 1) - 1;
        let xOffset = (index % 16) * 8;
        let yOffset = parseInt(index / 16) * 32;

        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(shirtSprite, xOffset, yOffset, 8, 8, 96, 120, 64, 64);

        sleeves = [
            ctx.getImageData(96, 136, 1, 1).data.slice(0, 3),
            ctx.getImageData(96, 144, 1, 1).data.slice(0, 3),
            ctx.getImageData(96, 152, 1, 1).data.slice(0, 3)
        ];
    };
</script>

<canvas bind:this={canvasElement} width=256 height=256/>

<style>
    canvas {
        position: absolute;
    }
</style>
