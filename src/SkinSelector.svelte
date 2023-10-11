<script>
    import { afterUpdate, onMount } from "svelte";
    import Arrow from './Arrow.svelte';
    import Line from './Line.svelte';
    import { replaceColor, getContext, fadeIn, fadeOut } from "./utils";

    export let skinId;
    export let bodySprite;
    export let skinData;
    export let eyeColor;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = getContext(canvasElement)

        bodySprite.callbacks.push(() => draw());
        draw();
    });

    afterUpdate(() => draw());

    const draw = () => {
        if (!ctx || !bodySprite.complete || !skinData) {
            return;
        }

        let index = (skinId || 1) - 1;

        drawHead(index - 2, 0);
        drawHead(index - 1, 1);
        drawHead(index + 0, 2);
        drawHead(index + 1, 3);
        drawHead(index + 2, 4);

        fadeIn(ctx);
        fadeOut(ctx);
    };

    const drawHead = (index, position) => {
        index = (index < 0 ? 24 + index : index) % 24;

        ctx.clearRect(position * 128, 0, 128, 128);
        ctx.drawImage(bodySprite, 0, 0, 16, 15, position * 128, -16, 128, 120);

        for (var i = 0; i < 12; i += 4) {
            replaceColor(
                ctx,
                skinData.slice(i, i + 3),
                skinData.slice(index * 12 + i, index * 12 + i + 3),
                [position * 128, 0, position * 128 + 128, 128]
            );
        }

        ctx.fillStyle = eyeColor;
        ctx.fillRect(position * 128 + 48, 72, 8, 16);
        ctx.fillRect(position * 128 + 72, 72, 8, 16);
    };

    let correctSkinId = () => skinId = Math.min(Math.max(skinId, 1), 24);

    let reduceSkin = () => skinId = ((skinId + 22) % 24) + 1;

    let increaseSkin = () => skinId = (skinId % 24) + 1;
</script>

<div class="outer">
    <div class="inner">
        <Arrow onclick={reduceSkin} dir="left"/>
        <Line />
        <canvas bind:this={canvasElement} width=640 height=128 />
        <Arrow onclick={increaseSkin} dir="right"/>
    </div>
    <input type="number" bind:value={skinId} on:change={correctSkinId} min="1" max="24"/>
    <input type="color" bind:value={eyeColor} />
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
