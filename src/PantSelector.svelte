<script>
    import { afterUpdate, onMount } from "svelte";
    import Arrow from './Arrow.svelte';
    import Line from './Line.svelte';
    import { tint, getContext, fadeIn, fadeOut } from "./utils";

    export let pantId;
    export let pantColor;
    export let pantSprite;

    let canvasElement;
    let ctx;
    onMount(() => {
        ctx = getContext(canvasElement)

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

        fadeIn(ctx);
        fadeOut(ctx);
    };

    const drawPant = (index, position) => {
        index = (index < 0 ? 4 + index : index) % 4;

        ctx.clearRect(position * 128, 0, 128, 128);
        
        ctx.drawImage(pantSprite, index * 192, 0, 16, 32, position * 128, -128, 128, 256);
    };

    let reducePant = () => pantId = ((pantId + 2) % 4) + 1;

    let increasePant = () => pantId = (pantId % 4) + 1;
</script>

<div class="outer">
    <div class="inner">
        <Arrow onclick={reducePant} dir="left"/>
        <Line />
        <canvas bind:this={canvasElement} width=640 height=128/>
        <Arrow onclick={increasePant} dir="right"/>
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
