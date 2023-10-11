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

export function rgb2hsv(color) {
  const r = parseInt("0x" + color.slice(1, 3)) / 255;
  const g = parseInt("0x" + color.slice(3, 5)) / 255;
  const b = parseInt("0x" + color.slice(5, 7)) / 255;

  const v = Math.max(r,g,b), c=v-Math.min(r,g,b);
  let h=c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)); 
  return [parseInt(((60*(h<0?h+6:h)) / 360) * 99), parseInt((v&&c/v) * 99), parseInt(v * 99)];
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

export function getContext(canvas) {
  const ctx = canvas.getContext("2d", {willReadFrequently: true})

  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  return ctx;
};

export function fadeIn(ctx, bounds = [0, 0, 128, 128]) {
  const width = bounds[2] - bounds[0];
  const imageData = ctx.getImageData(...bounds);
  const data = imageData.data;
  for (let i = 0; i < data.length; i+= 4) {
    data[i+3] = data[i+3] === 0 ? 0 : ((i / 4) % width);
  }
  ctx.putImageData(imageData, bounds[0], bounds[1]);
};

export function fadeOut(ctx, bounds = [512, 0, 640, 128]) {
  const width = bounds[2] - bounds[0];
  const imageData = ctx.getImageData(...bounds);
  const data = imageData.data;
  for (let i = 0; i < data.length; i+= 4) {
    data[i+3] = data[i+3] === 0 ? 0 : (width - ((i / 4) % width));
  }
  ctx.putImageData(imageData, bounds[0], bounds[1]);
};