type Rgba_type = {
  r: number;
  g: number;
  b: number;
  a: number;
};

/**
 * 处理照片
 */
class camera {
  canvas: HTMLCanvasElement | null = null;
  context: CanvasRenderingContext2D | null = null;
  processMap: Map<string, (rgba: Rgba_type) => Rgba_type> = new Map<string, (rgba: Rgba_type) => Rgba_type>();

  // 图片源数据
  originImgData: ImageData | undefined;
  // 图片更新后的data
  pixelData: Uint8ClampedArray | undefined;

  constructor(el: string | HTMLCanvasElement, _options?: any) {
    this.init(el, _options);
  }

  init(el: string | HTMLCanvasElement, _options?: any): void {
    if (typeof el === "string") {
      this.canvas = document.getElementById(el) as HTMLCanvasElement;
      this.context = this.canvas.getContext("2d");
    } else if (el instanceof HTMLCanvasElement) {
      this.canvas = el;
      this.context = this.canvas.getContext("2d");
    } else {
      this.canvas = null;
      this.context = null;
    }
    this.getCanvasImgData();
    this.copyImageData();
  }

  /**
   * 获取imgData像素点数据
   * @param canvas
   */
  getCanvasImgData() {
    if (this.canvas && this.context) {
      const _imgData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.originImgData = _imgData;

      return _imgData;
    } else {
      return null;
    }
  }

  /**
   * 复制图片源像素点数据
   */
  copyImageData() {
    if (this.originImgData) {
      this.pixelData = new Uint8ClampedArray(this.originImgData.data.length);
      const originData = this.originImgData.data;

      for (let i = 0, _ref = originData.length; i < _ref; i += 4) {
        this.pixelData[i] = originData[i];
        this.pixelData[i + 1] = originData[i + 1];
        this.pixelData[i + 2] = originData[i + 2];
        this.pixelData[i + 3] = originData[i + 3];
      }
    }
  }

  /**
   * 亮度
   * @param adjust
   * @returns
   */
  brightness(adjust: number) {
    adjust = Math.floor(255 * (adjust / 100));
    return this.process("brightness", function (rgba: Rgba_type) {
      rgba.r += adjust;
      rgba.g += adjust;
      rgba.b += adjust;
      return rgba;
    });
  }
  // 对比度
  contrast(adjust: number) {
    adjust = Math.pow((adjust + 100) / 100, 2);
    return this.process("contrast", function (rgba: Rgba_type) {
      rgba.r /= 255;
      rgba.r -= 0.5;
      rgba.r *= adjust;
      rgba.r += 0.5;
      rgba.r *= 255;
      rgba.g /= 255;
      rgba.g -= 0.5;
      rgba.g *= adjust;
      rgba.g += 0.5;
      rgba.g *= 255;
      rgba.b /= 255;
      rgba.b -= 0.5;
      rgba.b *= adjust;
      rgba.b += 0.5;
      rgba.b *= 255;
      return rgba;
    });
  }
  // 饱和值
  saturation(adjust: number) {
    adjust *= -0.01;
    return this.process("saturation", function (rgba: Rgba_type): Rgba_type {
      let max = Math.max(rgba.r, rgba.g, rgba.b);
      if (rgba.r !== max) {
        rgba.r += (max - rgba.r) * adjust;
      }
      if (rgba.g !== max) {
        rgba.g += (max - rgba.g) * adjust;
      }
      if (rgba.b !== max) {
        rgba.b += (max - rgba.b) * adjust;
      }
      return rgba;
    });
  }
  // 色调
  hue(adjust: number) {
    this.process("hue", function (rgba: Rgba_type) {
      let b, g, h, hsv, r, _ref;

      hsv = Convert.rgbToHSV(rgba.r, rgba.g, rgba.b);
      h = hsv.h * 100;
      h += Math.abs(adjust);
      h = h % 100;
      h /= 100;
      hsv.h = h;
      (_ref = Convert.hsvToRGB(hsv.h, hsv.s, hsv.v)), (r = _ref.r), (g = _ref.g), (b = _ref.b);
      rgba.r = r;
      rgba.g = g;
      rgba.b = b;
      return rgba;
    });
  }
  /**
   * 噪音
   * @param adjust
   * @returns
   */
  noise(adjust: number) {
    adjust = Math.abs(adjust) * 2.55;
    return this.process("noise", function (rgba: Rgba_type) {
      let rand = Calculate.randomRange(adjust * -1, adjust);
      rgba.r += rand;
      rgba.g += rand;
      rgba.b += rand;
      return rgba;
    });
  }

  process(type: string, func: (rgba: Rgba_type) => Rgba_type) {
    this.processMap.set(type, func);
    return this;
  }

  runProcess(callback: Function) {
    if (!this.originImgData || !this.pixelData) {
      return;
    }
    const mapKeys = this.processMap.keys();

    const { data } = this.originImgData;

    for (const key of mapKeys) {
      const func = this.processMap.get(key);
      if (func) {
        for (let i = 0; i < data.length; i += 4) {
          const rgba = func.call(this, {
            r: this.pixelData[i],
            g: this.pixelData[i + 1],
            b: this.pixelData[i + 2],
            a: this.pixelData[i + 3],
          });

          this.pixelData[i] = rgba.r;
          this.pixelData[i + 1] = rgba.g;
          this.pixelData[i + 2] = rgba.b;
          this.pixelData[i + 3] = rgba.a;
        }
      }
    }
    callback();
  }

  render(callback: Function) {
    const _this = this;

    if (callback == null) {
      callback = function () {};
    }
    this.runProcess(function () {
      if (_this.canvas && _this.context && _this.pixelData) {
        const _imageData = new ImageData(_this.pixelData, _this.canvas.width, _this.canvas.height);
        _this.context.putImageData(_imageData, 0, 0);
        _this.copyImageData();
      }
    });
    return callback.call(_this);
  }

  /**
   * reset change
   */
  reset() {
    if (this.canvas && this.originImgData) {
      this.canvas.getContext("2d")?.putImageData(this.originImgData, 0, 0);
    }
  }
}

// convert转换
const Convert = {
  hsvToRGB(h: number, s: number, v: number) {
    let b: any, f, g: any, i, p, q, r: any, t;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
    }
    return {
      r: Math.floor(r * 255),
      g: Math.floor(g * 255),
      b: Math.floor(b * 255),
    };
  },

  rgbToHSV(r: number, g: number, b: number) {
    let d, h: any, max, min, s, v;

    r /= 255;
    g /= 255;
    b /= 255;
    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    v = max;
    d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
      h = 0;
    } else {
      h = (function () {
        switch (max) {
          case r:
            return (g - b) / d + (g < b ? 6 : 0);
          case g:
            return (b - r) / d + 2;
          case b:
            return (r - g) / d + 4;
        }
      })();
      h /= 6;
    }
    return {
      h: h,
      s: s,
      v: v,
    };
  },

  rgbToXYZ(r: number, g: number, b: number) {
    var x, y, z;

    r /= 255;
    g /= 255;
    b /= 255;
    if (r > 0.04045) {
      r = Math.pow((r + 0.055) / 1.055, 2.4);
    } else {
      r /= 12.92;
    }
    if (g > 0.04045) {
      g = Math.pow((g + 0.055) / 1.055, 2.4);
    } else {
      g /= 12.92;
    }
    if (b > 0.04045) {
      b = Math.pow((b + 0.055) / 1.055, 2.4);
    } else {
      b /= 12.92;
    }
    x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    return {
      x: x * 100,
      y: y * 100,
      z: z * 100,
    };
  },

  xyzToRGB(x: number, y: number, z: number) {
    var b, g, r;

    x /= 100;
    y /= 100;
    z /= 100;
    r = 3.2406 * x + -1.5372 * y + -0.4986 * z;
    g = -0.9689 * x + 1.8758 * y + 0.0415 * z;
    b = 0.0557 * x + -0.204 * y + 1.057 * z;
    if (r > 0.0031308) {
      r = 1.055 * Math.pow(r, 0.4166666667) - 0.055;
    } else {
      r *= 12.92;
    }
    if (g > 0.0031308) {
      g = 1.055 * Math.pow(g, 0.4166666667) - 0.055;
    } else {
      g *= 12.92;
    }
    if (b > 0.0031308) {
      b = 1.055 * Math.pow(b, 0.4166666667) - 0.055;
    } else {
      b *= 12.92;
    }
    return {
      r: r * 255,
      g: g * 255,
      b: b * 255,
    };
  },
};

const Calculate = {
  randomRange(min: number, max: number, getFloat?: any) {
    var rand;

    if (getFloat == null) {
      getFloat = false;
    }
    rand = min + Math.random() * (max - min);
    if (getFloat) {
      return parseFloat(rand.toFixed(getFloat));
    } else {
      return Math.round(rand);
    }
  },
};

export default camera;
