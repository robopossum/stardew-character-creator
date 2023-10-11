<script>
    export let onclick;
    export let dir = 'left';
</script>
  
<button on:click={onclick} style={dir === 'right' ? 'right: 0px; --dir: -1' : '--dir: 1'}>
<svg
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:svgjs="http://svgjs.dev/svgjs"
    viewBox="0 0 480 480"
    preserveAspectRatio="xMidYMid slice"
>
    <defs>
        <pattern id="pppixelate-pattern" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="translate(0 0) scale(40) rotate(0)" shape-rendering="crispEdges">
            <rect width="2" height="1" x="4" y="1" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="3" y="2" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="4" y="2" fill="rgba(228, 174, 110, 1.00)"></rect>
            <rect width="1" height="1" x="5" y="2" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="2" y="3" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="3" y="3" fill="rgba(220, 123, 5, 1.00)"></rect>
            <rect width="1" height="1" x="4" y="3" fill="rgba(228, 174, 110, 1.00)"></rect>
            <rect width="6" height="1" x="5" y="3" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="1" y="4" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="2" y="4" fill="rgba(220, 123, 5, 1.00)"></rect>
            <rect width="7" height="1" x="3" y="4" fill="rgba(228, 174, 110, 1.00)"></rect>
            <rect width="1" height="1" x="10" y="4" fill="rgba(220, 123, 5, 1.00)"></rect>
            <rect width="1" height="1" x="11" y="4" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="0" y="5" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="1" y="5" fill="rgba(220, 123, 5, 1.00)"></rect>
            <rect width="1" height="1" x="2" y="5" fill="rgba(228, 174, 110, 1.00)"></rect>
            <rect width="7" height="1" x="3" y="5" fill="rgba(220, 123, 5, 1.00)"></rect>
            <rect width="1" height="1" x="10" y="5" fill="rgba(228, 174, 110, 1.00)"></rect>
            <rect width="1" height="1" x="11" y="5" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="0" y="6" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="1" y="6" fill="rgba(177, 78, 5, 1.00)"></rect>
            <rect width="9" height="1" x="2" y="6" fill="rgba(220, 123, 5, 1.00)"></rect>
            <rect width="1" height="1" x="11" y="6" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="1" y="7" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="2" y="7" fill="rgba(177, 78, 5, 1.00)"></rect>
            <rect width="7" height="1" x="3" y="7" fill="rgba(220, 123, 5, 1.00)"></rect>
            <rect width="1" height="1" x="10" y="7" fill="rgba(177, 78, 5, 1.00)"></rect>
            <rect width="1" height="1" x="11" y="7" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="2" y="8" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="3" y="8" fill="rgba(177, 78, 5, 1.00)"></rect>
            <rect width="1" height="1" x="4" y="8" fill="rgba(177, 78, 5, 1.00)"></rect>
            <rect width="6" height="1" x="5" y="8" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="3" y="9" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="1" height="1" x="4" y="9" fill="rgba(177, 78, 5, 1.00)"></rect>
            <rect width="1" height="1" x="5" y="9" fill="rgba(91, 43, 42, 1.00)"></rect>
            <rect width="2" height="1" x="4" y="10" fill="rgba(91, 43, 42, 1.00)"></rect>
        </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#pppixelate-pattern)"></rect>
</svg>
</button>

<style>
    button {
      position: absolute;
      width: 64px;
      top: 32px;
      bottom: 32px;
      color: #fff0;
      background-color: #fff0;
      border: none;
      margin: 0;
      padding: 0;
      z-index: 120;
  }
  button:hover > svg{
    animation-name: pulse;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
  button:focus > svg{
    animation-name: pulse;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
  
  button:active > svg{
    animation-name: pump;
    animation-duration: 0.1s;
  }
  svg {
    transform: scale(var(--dir));
  }

  @keyframes pulse {
    from {
        transform: scale(calc(1 * var(--dir)));
    }

    to {
        transform: scale(calc(1.08 * var(--dir)));
    }
  }

  @keyframes pump {
    from {
        transform: scale(calc(1 * var(--dir)));
    }

    to {
        transform: scale(calc(1.2 * var(--dir)));
    }
  }
</style>