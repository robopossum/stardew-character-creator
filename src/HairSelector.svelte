<script>
    import { afterUpdate, onMount } from "svelte";
    import Arrow from './Arrow.svelte';
    import Line from './Line.svelte';
    import { tint, getContext, fadeIn, fadeOut } from "./utils";

    export let hairId;
    export let hairColor;
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

        let index = (hairId || 1) - 1;

        drawHair(index - 2, 0);
        drawHair(index - 1, 1);
        drawHair(index + 0, 2);
        drawHair(index + 1, 3);
        drawHair(index + 2, 4);

        tint(ctx, hairColor, [0, 0, 640, 128]);
        fadeIn(ctx);
        fadeOut(ctx);
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

    let reduceHair = () => hairId = ((hairId + 77) % 79) + 1;

    let increaseHair = () => hairId = (hairId % 79) + 1;
</script>

<div class="outer">
    <div class="inner">
        <Arrow onclick={reduceHair} dir="left"/>
        <Line />
        <canvas bind:this={canvasElement} width=640 height=128 />
        <Arrow onclick={increaseHair} dir="right"/>
    </div>
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
