import colorutil from 'color-util';

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
    if (data[i + 3] !== 0 && inRange(data[i], prevRGB[0], 2) && inRange(data[i + 1], prevRGB[1], 2) && inRange(data[i + 2], prevRGB[2], 2)) {
      data[i] = newRGB[0];
      data[i + 1] = newRGB[1];
      data[i + 2] = newRGB[2];
    }
  }
  ctx.putImageData(imgData, bounds[0], bounds[1]);
};

function inRange(x, y, range) {
  return Math.abs(x - y) < range;
}

export function rgb2hsv(color) {
  const hsv = colorutil.convert([color], colorutil.hex.to.rgb, colorutil.rgb.to.hsv)[0];
  return [
    Math.min(Math.round(hsv.h * 100), 99),
    Math.min(Math.round(hsv.s * 100), 99),
    Math.min(Math.round(hsv.v * 100), 99)
  ];
};

export function hsv2rgb(h,s,v) {
  h = h / 100, s = s / 100, v = v / 100;
  return colorutil.convert([{h, s, v}], colorutil.hsv.to.rgb, colorutil.rgb.to.hex)[0];
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