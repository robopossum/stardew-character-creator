<script>
    import NumberInput from "./NumberInput.svelte";
    import ColorInput from "./ColorInput.svelte";

    export let hairColor;
    export let hairId;

    export let eyeColor;

    export let skinId;

    export let shirtId;

    export let pantColor;
    export let pantId;

    export let accessoryId;

    let correctHairId = () => hairId = (hairId < 1 ? 78 + hairId : hairId) % 79;

    let correctSkinId = () => skinId = Math.min(Math.max(skinId, 1), 24);

    let correctShirtId = () => shirtId = Math.min(Math.max(shirtId, 1), 112);

    let correctPantId = () => pantId = Math.min(Math.max(pantId, 1), 4);

    let correctAccessoryId = () => accessoryId = Math.min(Math.max(accessoryId, 1), 20);
</script>

<div>
    <NumberInput label="Hair" bind:value={hairId} max={79} />
    <ColorInput label="Hair Color" bind:value={hairColor} />

    <NumberInput label="Skin" bind:value={skinId} max={24} />
    <ColorInput label="Eye Color" bind:value={eyeColor} />

    <NumberInput label="Shirt" bind:value={shirtId} max={112} />
    
    <NumberInput label="Pants" bind:value={pantId} max={4} />
    <ColorInput label="Pants Color" bind:value={pantColor} />

    <NumberInput label="Accessory" bind:value={accessoryId} max={20} />
</div>

<style>
    div {
        display:flex;
        position: relative;
        flex-direction: column;
        background-color: #ecaa67;
        padding: 1em;
        box-shadow: 3px 3px #d68f54, -3px -3px #d68f54, -3px 3px #d68f54, 3px -3px #d68f54,
            6px 6px #853605, -6px -6px #853605, -6px 6px #853605, 6px -6px #853605,
            9px 9px #dc7b05, -9px -9px #dc7b05, -9px 9px #dc7b05, 9px -9px #dc7b05,
            12px 12px #b14e05, -12px -12px #b14e05, -12px 12px #b14e05, 12px -12px #b14e05,
            15px 15px #853605, -15px -15px #853605, -15px 15px #853605, 15px -15px #853605;
    }

    @media (max-width: 1200px) {
        div {
            margin-top: 3em;
            margin-bottom: 3em;
            flex-direction: row;
            flex-wrap: wrap;
        }
    }
</style>
