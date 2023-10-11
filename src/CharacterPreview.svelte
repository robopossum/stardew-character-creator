<script>
    import Body from './Body.svelte';
    import Eyes from './Eyes.svelte';
    import Hair from './Hair.svelte';
    import Shirt from './Shirt.svelte';
    import Pants from './Pants.svelte';
    import Accessory from './Accessory.svelte';

    export let hairColor;
    export let hairId;
    export let hairSprite;
    export let hairFancySprite;

    export let eyeColor;
    export let eyeSprite;

    export let skinId;
    let armColor;
    export let bodySprite;
    export let skinSprite;
    export let skinColors;
    export let skinData;

    export let shirtId;
    export let shirtSprite;

    export let pantColor;
    export let pantId;
    export let pantSprite;

    export let accessoryId;
    export let accessorySprite;
</script>

<div class="outer">
    <img src="./background.png" alt="Chracter background"/>
    <div class="inner">
        <Body
            skinId={skinId}
            armColor={armColor}
            bodySprite={bodySprite}
            skinSprite={skinSprite}
            bind:skinColors={skinColors}
            bind:skinData={skinData}
        />
        <Eyes color={eyeColor} eyeSprite={eyeSprite} />
        <Hair color={hairColor} id={hairId} hairSprite={hairSprite} hairFancySprite={hairFancySprite} />
        <Pants color={pantColor} id={pantId} pantSprite={pantSprite} />
        <Shirt id={shirtId} bind:sleeves={armColor} shirtSprite={shirtSprite} />
        <Accessory id={accessoryId} hairColor={hairColor} accessorySprite={accessorySprite} />
    </div>
</div>

<style>
    .outer {
        width: 256px;
        height: 384px;
        position: relative;
        margin: 10px 0 20px 0px;
    }
    .inner {
        position: absolute;
        top: 64px;
    }
    img {
        position: absolute;
        width: 256px;
        height: 384px;
    }
</style>
