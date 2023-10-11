<script>
    import { afterUpdate, onMount } from "svelte";
    import { replaceColor, tint } from "./utils";

    export let pantId;
    export let pantColor;
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

        let index = (pantId || 1) - 1;

        drawPant(index - 2, 0);
        drawPant(index - 1, 1);
        drawPant(index + 0, 2);
        drawPant(index + 1, 3);
        drawPant(index + 2, 4);

        tint(ctx, pantColor, [0, 0, 640, 128]);
    };

    const drawPant = (index, position) => {
        index = (index < 0 ? 4 + index : index) % 4;

        ctx.clearRect(position * 128, 0, 128, 128);
        
        ctx.drawImage(pantSprite, index * 192, 0, 16, 32, position * 128, -128, 128, 256);
    };

    let correctPantId = () => pantId = Math.min(Math.max(pantId, 1), 4);
</script>

<div>
    <canvas bind:this={canvasElement} width=640 height=128/>
    <input type="color" bind:value={pantColor} />
    <input type="number" bind:value={pantId} on:change={correctPantId} min="1" max="4"/>
</div>

<style>
    div {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>
