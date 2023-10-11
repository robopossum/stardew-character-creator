<script>
    import CharacterPreview from './CharacterPreview.svelte';
    import CharacterInputs from './CharacterInputs.svelte';
    import BoringInputs from './BoringInputs.svelte';
    import { loadImage, rgb2hsv } from './utils';

    let hairColor = '#c15b32';
    let hairId = 1;
    let hairSprite = loadImage('hairstyles');
    let hairFancySprite = loadImage('hairstyles2');

    let eyeColor = '#7a4434';
    let eyeSprite = loadImage('eyes');

    let skinId = 1;
    let bodySprite = loadImage('farmer_base');
    let skinSprite = loadImage('skinColors');
    let skinColors;
    let skinData;

    let shirtId = 1;
    let shirtSprite = loadImage('shirts');

    let pantColor = '#2e55b7';
    let pantId = 1;
    let pantSprite = loadImage('pants');

    let accessoryId = 1;
    let accessorySprite = loadImage('accessories');

    let petId = 1;

    $: output = [
        skinId,
        hairId,
        shirtId,
        pantId,
        accessoryId,
        ...rgb2hsv(eyeColor),
        ...rgb2hsv(hairColor),
        ...rgb2hsv(pantColor),
        petId
    ];

    let copyToClipboard = () => navigator.clipboard.writeText(output);
</script>

<main>
    <div class="character">
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
            bind:petId={petId}
        />

        <div class="waffle">
            <p><b>Stardew valley character creator</b></p>
            <input value={output.join()} />
            <button on:click={copyToClipboard} style="cursor: pointer">Copy to Clipboard</button>
            <div class="links">
                <a href="https://github.com/robopossum/stardew-character-creator">Source</a>
                <a href="https://github.com/robopossum/stardew-character-creator/issues">Submit a bug</a>
            </div>
        </div>
    </div>
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

    <BoringInputs
        bind:hairColor={hairColor}
        bind:hairId={hairId}
        bind:eyeColor={eyeColor}
        bind:skinId={skinId}
        bind:shirtId={shirtId}
        bind:pantColor={pantColor}
        bind:pantId={pantId}
        bind:accessoryId={accessoryId}
    />
</main>

<style>
    main {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        align-items: center;
        height: 100vh;
        margin: 0 auto;
    }
    .character {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .waffle {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #ecaa67;
        padding: 1em;
        box-shadow: 3px 3px #d68f54, -3px -3px #d68f54, -3px 3px #d68f54, 3px -3px #d68f54,
            6px 6px #853605, -6px -6px #853605, -6px 6px #853605, 6px -6px #853605,
            9px 9px #dc7b05, -9px -9px #dc7b05, -9px 9px #dc7b05, 9px -9px #dc7b05,
            12px 12px #b14e05, -12px -12px #b14e05, -12px 12px #b14e05, 12px -12px #b14e05,
            15px 15px #853605, -15px -15px #853605, -15px 15px #853605, 15px -15px #853605;
    }
    .links {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
    }
    @media (max-width: 1200px) {
        main {
            flex-direction: column;
            height: auto;
        }
        .character {
            flex-direction: row-reverse;
        }
        .waffle {
            margin-right: 3em;
        }
    }
</style>
