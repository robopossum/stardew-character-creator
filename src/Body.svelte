<script>
    import { afterUpdate, onMount } from "svelte";
    import { replaceColor, getContext } from "./utils";

    export let skinId;
    export let armColor;
    export let bodySprite;
    export let skinSprite;
    export let skinColors;
    export let skinData;

    let canvasElement;
    let skinCanvas;
    let ctx;

    onMount(() => {
        ctx = getContext(canvasElement)

        bodySprite.callbacks.push(() => draw());
        draw();

        skinSprite.onload = () => getSkinData();
        getSkinData();
    });

    afterUpdate(() => draw());

    const getSkinData = () => {
        if (!skinSprite.complete) {
            return;
        }

        skinCanvas.height = skinSprite.height;
        skinCanvas.width = skinSprite.width;
        let skinCtx = skinCanvas.getContext("2d")
        skinCtx.drawImage(skinSprite, 0, 0);
        skinData = skinCtx.getImageData(0, 0, skinCanvas.width, skinCanvas.height).data;
        skinColors = [skinData.slice(0, 3), skinData.slice(4, 7), skinData.slice(8, 11)];
    };

    const draw = () => {
        if (!ctx || !bodySprite.complete) {
            return;
        }

        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(bodySprite, 0, 0, 16, 32, 64, 0, 128, 256);
        ctx.drawImage(bodySprite, 96, 0, 16, 32, 64, 0, 128, 256);

        if (skinId > 1) {
            const index = (skinId - 1) * 12;
            for (var i = 0; i < 12; i += 4) {
                skinColors[i / 4] = skinData.slice(index + i, index + i + 3);
                replaceColor(
                    ctx,
                    skinData.slice(i, i + 3),
                    skinData.slice(index + i, index + i + 3)
                );
            }
        }

        if (armColor) {
            replaceColor(
              ctx,
              [142, 31, 12],
              armColor[0]
            );
            replaceColor(
              ctx,
              [112, 23, 24],
              armColor[1]
            );
            replaceColor(
              ctx,
              [74, 12, 6],
              armColor[2]
            );
        }
    };
</script>

<canvas bind:this={canvasElement} width=256 height=256 />
<canvas bind:this={skinCanvas} style="display: none" />

<style>
    canvas {
        position: absolute;
    }
</style>
