<script>
    import CharacterPreview from './CharacterPreview.svelte';
    import CharacterInputs from './CharacterInputs.svelte';
    import { loadImage } from './utils';

    let hairColor;
    let hairId;
    let hairSprite = loadImage('hairstyles');
    let hairFancySprite = loadImage('hairstyles2');

    let eyeColor;
    let eyeSprite = loadImage('eyes');

    let skinId;
    let bodySprite = loadImage('farmer_base');
    let skinSprite = loadImage('skinColors');
    let skinColors;
    let skinData;

    let shirtId;
    let shirtSprite = loadImage('shirts');

    let pantColor;
    let pantId;
    let pantSprite = loadImage('pants');

    let accessoryId;
    let accessorySprite = loadImage('accessories');
</script>

<main>
    <CharacterPreview
        hairColor={hairColor}
        hairId={hairId}
        hairSprite={hairSprite}
        hairFancySprite={hairFancySprite}
        eyeColor={eyeColor}
        eyeSprite={eyeSprite}
        skinId={skinId}
        bodySprite={bodySprite}
        skinSprite={skinSprite}
        bind:skinColors={skinColors}
        bind:skinData={skinData}
        shirtId={shirtId}
        shirtSprite={shirtSprite}
        pantColor={pantColor}
        pantId={pantId}
        pantSprite={pantSprite}
        accessoryId={accessoryId}
        accessorySprite={accessorySprite}
    />
    <CharacterInputs
        bind:hairColor={hairColor}
        bind:hairId={hairId}
        hairSprite={hairSprite}
        hairFancySprite={hairFancySprite}
        bind:eyeColor={eyeColor}
        bind:skinId={skinId}
        bodySprite={bodySprite}
        skinColors={skinColors}
        skinData={skinData}
        bind:shirtId={shirtId}
        shirtSprite={shirtSprite}
        bind:pantColor={pantColor}
        bind:pantId={pantId}
        pantSprite={pantSprite}
        bind:accessoryId={accessoryId}
        accessorySprite={accessorySprite}
    />
</main>

<style>
    main {
        display: flex;
        justify-content: space-around;
        align-items: center;
        height: 100vh;
        margin: 0 auto;
    }
</style>
