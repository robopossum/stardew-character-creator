<script>
    import { afterUpdate, onMount } from "svelte";
    import { tint } from "./utils";

    export let hairId;
    export let hairColor;
    export let hairSprite;
    export let hairFancySprite;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = canvasElement.getContext("2d")

        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        hairSprite.callbacks.push(() => draw());
        hairFancySprite.callbacks.push(() => draw());
        draw();
    });

    afterUpdate(() => draw());

    const draw = () => {
        if (!ctx || !hairSprite.complete || !hairFancySprite.complete) {
            return;
        }

        let index = (hairId || 1) - 1;

        drawHair(index - 2, 0);
        drawHair(index - 1, 1);
        drawHair(index + 0, 2);
        drawHair(index + 1, 3);
        drawHair(index + 2, 4);

        tint(ctx, hairColor, [0, 0, 640, 128]);

        const imageData = ctx.getImageData(0, 0, 128, 128);
        const data = imageData.data;
        for (let i = 0; i < data.length; i+= 4) {
            data[i+3] = data[i+3] === 0 ? 0 : ((i / 4) % 128);
        }
        ctx.putImageData(imageData, 0, 0);
    };

    const drawHair = (index, position) => {
        index = (index < 0 ? 79 + index : index) % 79;
        const fancy = index > 55;
        index = fancy ? index - 56 : index;
        const xOffset = (index % 8) * 16;
        const yOffset = parseInt(index / 8) * (fancy ? 128 : 96);

        ctx.clearRect(position * 128, 0, 128, 128);
        ctx.drawImage(fancy ? hairFancySprite : hairSprite, xOffset, yOffset, 16, 32, position * 128, fancy ? -24 : -16, 128, 256);
    };

    let correctHairId = () => hairId = (hairId < 1 ? 78 + hairId : hairId) % 79;
</script>

<div>
    <canvas bind:this={canvasElement} width=640 height=128 />
    <input type="number" bind:value={hairId} on:change={correctHairId} min="0" max="80"/>
    <input type="color" bind:value={hairColor} />
</div>

<style>
    div {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>
