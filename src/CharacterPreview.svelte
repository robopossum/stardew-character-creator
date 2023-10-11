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

    export let petId;

    let incrementPet = () => {
        petId = (petId % 6) + 1;
    }
</script>

<div class="outer">
    <img class="background" src="./background.png" alt="Chracter background"/>
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
        <button class="pet" on:click={incrementPet}>
            <img src="./pet_1.png" alt="Pet 1" style={petId === 1 ? 'display: block' : 'display: none'}/>
            <img src="./pet_2.png" alt="Pet 2" style={petId === 2 ? 'display: block' : 'display: none'}/>
            <img src="./pet_3.png" alt="Pet 3" style={petId === 3 ? 'display: block' : 'display: none'}/>
            <img src="./pet_4.png" alt="Pet 4" style={petId === 4 ? 'display: block' : 'display: none'}/>
            <img src="./pet_5.png" alt="Pet 5" style={petId === 5 ? 'display: block' : 'display: none'}/>
            <img src="./pet_6.png" alt="Pet 6" style={petId === 6 ? 'display: block' : 'display: none'}/>
        </button>
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
        margin-top: 64px;
    }
    .background {
        position: absolute;
        width: 256px;
        height: 384px;
        image-rendering: pixelated;
    }
    .pet {
        background-color: #0000;
        border: none;
        position: absolute;
        right: 24px;
        bottom: 24px;
        cursor: pointer;
    }
    .pet > img {
        width: 64px;
        image-rendering: pixelated;
    }
</style>
