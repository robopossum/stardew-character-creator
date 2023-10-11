<script>
    import { afterUpdate, onMount } from "svelte";
    import Arrow from './Arrow.svelte';
    import Line from './Line.svelte';
    import { replaceColor, tint, getContext, fadeIn, fadeOut } from "./utils";

    export let skinId;
    export let bodySprite;
    export let skinData;
    export let eyeColor;
    export let hairColor;
    export let accessoryId;
    export let accessorySprite;

    let skinCanvas;
    let skinCtx;

    let canvasElement;
    let ctx;
    onMount(() => {
        skinCtx = getContext(skinCanvas)

        ctx = getContext(canvasElement)

        bodySprite.callbacks.push(() => draw());
        accessorySprite.callbacks.push(() => draw());
        draw();
    });

    afterUpdate(() => draw());

    const draw = () => {
        if (!ctx || !bodySprite.complete || !skinData || !accessorySprite.complete) {
            return;
        }

        let skin = (skinId || 1) - 1;
        [0,1,2,3,4].forEach((i) => drawHead(skin, i));

        let index = (accessoryId || 1) - 2;

        drawAccessory(index - 2, 0);
        drawAccessory(index - 1, 1);
        drawAccessory(index + 0, 2);
        drawAccessory(index + 1, 3);
        drawAccessory(index + 2, 4);

        fadeIn(ctx);
        fadeIn(skinCtx);
        fadeOut(ctx);
        fadeOut(skinCtx);
    };

    const drawAccessory = (index, position) => {
        index = (index < 0 ? 20 + index : index) % 20;

        ctx.clearRect(position * 128, 0, 128, 128);

        const xOffset = (index % 8) * 16;
        const yOffset = parseInt(index / 8) * 32;
       
        ctx.drawImage(accessorySprite, xOffset, yOffset, 16, 15, position * 128, 0, 128, 120);

        if (index < 6) {
          tint(ctx, hairColor, [position * 128, 0, 128, 120]);
        }
    };

    const drawHead = (index, position) => {
        index = (index < 0 ? 24 + index : index) % 24;

        skinCtx.clearRect(position * 128, 0, 128, 128);
        skinCtx.drawImage(bodySprite, 0, 0, 16, 15, position * 128, -16, 128, 120);

        for (var i = 0; i < 12; i += 4) {
            replaceColor(
                skinCtx,
                skinData.slice(i, i + 3),
                skinData.slice(index * 12 + i, index * 12 + i + 3),
                [position * 128, 0, position * 128 + 128, 128]
            );
        }

        skinCtx.fillStyle = eyeColor;
        skinCtx.fillRect(position * 128 + 48, 72, 8, 16);
        skinCtx.fillRect(position * 128 + 72, 72, 8, 16);
    };

    let correctAccessoryId = () => accessoryId = Math.min(Math.max(accessoryId, 1), 20);

    let reduceAccessory = () => accessoryId = ((accessoryId + 18) % 20) + 1;

    let increaseAccessory = () => accessoryId = (accessoryId % 20) + 1;
</script>

<div class="outer">
    <div class="inner">
        <Arrow onclick={reduceAccessory} dir="left"/>
        <Line />
        <canvas bind:this={skinCanvas} width=640 height=128 style="position: absolute"/>
        <canvas bind:this={canvasElement} width=640 height=128 style="position: relative; z-index: 100"/>
        <Arrow onclick={increaseAccessory} dir="right"/>
    </div>
    <input type="number" bind:value={accessoryId} on:change={correctAccessoryId} min="1" max="20"/>
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
