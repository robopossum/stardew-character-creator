<script>
    import SkinSelector from "./SkinSelector.svelte";
    import ShirtSelector from "./ShirtSelector.svelte";
    import PantSelector from "./PantSelector.svelte";
    import HairSelector from "./HairSelector.svelte";
    import AccessorySelector from "./AccessorySelector.svelte";

    export let hairColor = '#c15b32';
    export let hairId = 1;
    export let hairSprite;
    export let hairFancySprite;

    export let eyeColor = '#7a4434';

    export let skinId = 1;
    export let bodySprite;
    export let skinColors;
    export let skinData;

    export let shirtId = 1;
    export let shirtSprite;

    export let pantColor = '#2e55b7';
    export let pantId = 1;
    export let pantSprite;

    export let accessoryId = 5;
    export let accessorySprite;
</script>

<div>
    <HairSelector
        bind:hairId={hairId}
        bind:hairColor={hairColor}
        hairSprite={hairSprite}
        hairFancySprite={hairFancySprite}
    />
    <SkinSelector
        bind:skinId={skinId}
        bodySprite={bodySprite}
        skinData={skinData}
        bind:eyeColor={eyeColor}
    />
    <ShirtSelector
        bind:shirtId={shirtId}
        shirtSprite={shirtSprite}
        bodySprite={bodySprite}
        skinColors={skinColors}
    />
    <PantSelector
        bind:pantId={pantId}
        bind:pantColor={pantColor}
        pantSprite={pantSprite}
    />
    <AccessorySelector
        bodySprite={bodySprite}
        skinId={skinId}
        skinData={skinData}
        eyeColor={eyeColor}
        hairColor={hairColor}
        accessorySprite={accessorySprite}
        bind:accessoryId={accessoryId}
    />
</div>

<style>
    div {
        display:flex;
        flex-direction: column;
        background-color: #ecaa67;
        padding: 1em;
        box-shadow: 3px 3px #d68f54, -3px -3px #d68f54, -3px 3px #d68f54, 3px -3px #d68f54,
            6px 6px #853605, -6px -6px #853605, -6px 6px #853605, 6px -6px #853605,
            9px 9px #dc7b05, -9px -9px #dc7b05, -9px 9px #dc7b05, 9px -9px #dc7b05,
            12px 12px #b14e05, -12px -12px #b14e05, -12px 12px #b14e05, 12px -12px #b14e05,
            15px 15px #853605, -15px -15px #853605, -15px 15px #853605, 15px -15px #853605;
    }
</style>
