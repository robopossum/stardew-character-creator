export function tint(ctx, color, bounds = [0, 0, 256, 256]) {
    const r = parseInt("0x" + color.slice(1,3));
    const g = parseInt("0x" + color.slice(3,5));
    const b = parseInt("0x" + color.slice(5,7));
    const imgData = ctx.getImageData(...bounds);
    const data = imgData.data;
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] !== 0) {
        data[i] = parseInt(((data[i] / 255) * (r / 255)) * 255);
        data[i + 1] = parseInt(((data[i + 1] / 255) * (g / 255)) * 255);
        data[i + 2] = parseInt(((data[i + 2] / 255) * (b / 255)) * 255);
      }
    }
    
    ctx.clearRect(...bounds);
    ctx.putImageData(imgData, bounds[0], bounds[1]);
};

export function replaceColor(ctx, prevRGB, newRGB, bounds = [0, 0, 256, 256]) {
  const imgData = ctx.getImageData(...bounds);
  const data = imgData.data;
  for (var i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 0 && data[i] === prevRGB[0] && data[i + 1] === prevRGB[1] && data[i + 2] === prevRGB[2]) {
      data[i] = newRGB[0];
      data[i + 1] = newRGB[1];
      data[i + 2] = newRGB[2];
    }
  }
  ctx.putImageData(imgData, bounds[0], bounds[1]);
};

export function loadImage(sprite) {
  let img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = './' + sprite + '.png';
  img.callbacks = [];
  img.onload = () => {
    img.callbacks.forEach((callback) => callback());
  };

  return img;
};
