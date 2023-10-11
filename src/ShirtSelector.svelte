<script>
    import { afterUpdate, onMount } from "svelte";
    import Arrow from './Arrow.svelte';
    import Line from './Line.svelte';
    import { replaceColor, getContext, fadeIn, fadeOut } from "./utils";

    export let shirtId;
    export let shirtSprite;
    export let bodySprite;
    export let skinColors;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = getContext(canvasElement)

        shirtSprite.callbacks.push(() => draw());
        bodySprite.callbacks.push(() => draw());
        draw();
    });

    afterUpdate(() => draw());

    const draw = () => {
        if (!ctx || !shirtSprite.complete || !bodySprite.complete) {
            return;
        }

        let index = (shirtId || 1) - 1;

        drawShirt(index - 2, 0);
        drawShirt(index - 1, 1);
        drawShirt(index + 0, 2);
        drawShirt(index + 1, 3);
        drawShirt(index + 2, 4);

        fadeIn(ctx);
        fadeOut(ctx);

        if (!skinColors) {
            return;
        }

        replaceColor(
            ctx,
            [107, 0, 58],
            skinColors[0],
            [0, 0, 640, 128]
        );
        replaceColor(
            ctx,
            [224, 107, 101],
            skinColors[1],
            [0, 0, 640, 128]
        );
        replaceColor(
            ctx,
            [249, 174, 137],
            skinColors[2],
            [0, 0, 640, 128]
        );
    };

    const drawShirt = (index, position) => {
        index = (index < 0 ? 112 + index : index) % 112;

        ctx.clearRect(position * 128, 0, 128, 128);

        let xOffset = (index % 16) * 8;
        let yOffset = parseInt(index / 16) * 32;

        ctx.drawImage(bodySprite, 96, 0, 16, 32, position * 128, -120, 128, 256);

        ctx.drawImage(shirtSprite, xOffset, yOffset, 8, 8, position * 128 + 32, 0, 64, 64);
        replaceColor(
            ctx,
            [142, 31, 12], //Light red
            ctx.getImageData(position * 128 + 36, 20, 1, 1).data.slice(0, 3),
            [position * 128, 0, position * 128 + 128, 128]
        );
        replaceColor(
            ctx,
            [112, 23, 24], //Middle red
            ctx.getImageData(position * 128 + 36, 28, 1, 1).data.slice(0, 3),
            [position * 128, 0, position * 128 + 128, 128]
        );
        replaceColor(
            ctx,
            [74, 12, 6], //Dark red
            ctx.getImageData(position * 128 + 36, 36, 1, 1).data.slice(0, 3),
            [position * 128, 0, position * 128 + 128, 128]
        );
    };

    let correctShirtId = () => shirtId = Math.min(Math.max(shirtId, 1), 112);

    let reduceShirt = () => shirtId = ((shirtId + 110) % 112) + 1;

    let increaseShirt = () => shirtId = (shirtId % 112) + 1;
</script>

<div class="outer">
    <div class="inner">
        <Arrow onclick={reduceShirt} dir="left"/>
        <Line />
        <canvas bind:this={canvasElement} width=640 height=128 />
        <Arrow onclick={increaseShirt} dir="right"/>
    </div>
    <input type="number" bind:value={shirtId} on:change={correctShirtId} min="1" max="112"/>
</div>

<style>
    .outer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .inner {
        position: relative;
    }
</style>
