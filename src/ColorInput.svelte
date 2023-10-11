<script>
    export let value;

    export let label;
</script>

<div>
    <label for="input">{label}</label>
    <input type="color" bind:value={value} />
</div>

<style>
    div {
        display: flex;
        flex-direction: column;
        margin: 1em;
    }
    label {
        font-weight: 500;
    }
    input {
        background-color: #0000;
        border: none;
        margin: 0;
        padding: 0;
        width: 64px;
        height: 64px;
        cursor: pointer;
    }
</style>