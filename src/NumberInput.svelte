<script>
    export let value;

    export let label;
    export let min = 1;
    export let max;

    let correctValue = () => {value = Math.min(Math.max(value, min), max)}
</script>

<div>
    <label for="input">{label}</label>
    <input type="number" bind:value={value} on:change={correctValue} min={min} max={max}/>
</div>

<style>
    div {
        display: flex;
        flex-direction: column;
    }
    label {
        font-weight: 500;
    }
    input {
        background-color: #0001;
        border-top: none;
        border-left: none;
        border-right: none;
        border-bottom: 2px solid #5b2b2a;
    }
</style>