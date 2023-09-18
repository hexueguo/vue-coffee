type Rgba_type = {
  r: number
  g: number
  b: number
  a: number
}
// class BlurStack {
//   r: number
//   g: number
//   b: number
//   a: number
//   next: BlurStack
//   constructor() {
//     this.r = 0
//     this.g = 0
//     this.b = 0
//     this.a = 0
//     this.next = new BlurStack()
//   }
// }

/**
 * 处理照片
 */
class camera {
  canvas: HTMLCanvasElement | null = null
  context: CanvasRenderingContext2D | null = null
  processMap: Map<string, (rgba: Rgba_type) => Rgba_type> = new Map<string, (rgba: Rgba_type) => Rgba_type>()

  // 图片源数据
  originImgData: ImageData | undefined
  // 图片更新后的data
  pixelData: Uint8ClampedArray | undefined

  constructor(el: string | HTMLCanvasElement, _options?: any) {
    this.init(el, _options)
  }

  init(el: string | HTMLCanvasElement, _options?: any): void {
    if (typeof el === 'string') {
      this.canvas = document.getElementById(el) as HTMLCanvasElement
      this.context = this.canvas.getContext('2d')
    } else if (el instanceof HTMLCanvasElement) {
      this.canvas = el
      this.context = this.canvas.getContext('2d')
    } else {
      this.canvas = null
      this.context = null
    }
    this.getCanvasImgData()
    this.copyImageData()
  }

  /**
   * 获取imgData像素点数据
   * @param canvas
   */
  getCanvasImgData() {
    if (this.canvas && this.context) {
      const _imgData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
      this.originImgData = _imgData

      return _imgData
    } else {
      return null
    }
  }

  /**
   * 复制图片源像素点数据
   */
  copyImageData() {
    if (this.originImgData) {
      this.pixelData = new Uint8ClampedArray(this.originImgData.data.length)
      const originData = this.originImgData.data

      for (let i = 0, _ref = originData.length; i < _ref; i += 4) {
        this.pixelData[i] = originData[i]
        this.pixelData[i + 1] = originData[i + 1]
        this.pixelData[i + 2] = originData[i + 2]
        this.pixelData[i + 3] = originData[i + 3]
      }
    }
  }

  /**
   * 伽马
   * @param adjust
   * @returns
   */
  gamma(adjust: number) {
    return this.process('gamma', function (rgba) {
      rgba.r = Math.pow(rgba.r / 255, adjust) * 255
      rgba.g = Math.pow(rgba.g / 255, adjust) * 255
      rgba.b = Math.pow(rgba.b / 255, adjust) * 255
      return rgba
    })
  }

  /**
   * 亮度
   * @param adjust
   * @returns
   */
  brightness(adjust: number) {
    adjust = Math.floor(255 * (adjust / 100))
    return this.process('brightness', function (rgba: Rgba_type) {
      rgba.r += adjust
      rgba.g += adjust
      rgba.b += adjust
      return rgba
    })
  }
  // 对比度
  contrast(adjust: number) {
    adjust = Math.pow((adjust + 100) / 100, 2)
    return this.process('contrast', function (rgba: Rgba_type) {
      rgba.r /= 255
      rgba.r -= 0.5
      rgba.r *= adjust
      rgba.r += 0.5
      rgba.r *= 255
      rgba.g /= 255
      rgba.g -= 0.5
      rgba.g *= adjust
      rgba.g += 0.5
      rgba.g *= 255
      rgba.b /= 255
      rgba.b -= 0.5
      rgba.b *= adjust
      rgba.b += 0.5
      rgba.b *= 255
      return rgba
    })
  }
  // 饱和值
  saturation(adjust: number) {
    adjust *= -0.01
    return this.process('saturation', function (rgba: Rgba_type): Rgba_type {
      let max = Math.max(rgba.r, rgba.g, rgba.b)
      if (rgba.r !== max) {
        rgba.r += (max - rgba.r) * adjust
      }
      if (rgba.g !== max) {
        rgba.g += (max - rgba.g) * adjust
      }
      if (rgba.b !== max) {
        rgba.b += (max - rgba.b) * adjust
      }
      return rgba
    })
  }
  // 色调
  hue(adjust: number) {
    this.process('hue', function (rgba: Rgba_type) {
      let b, g, h, hsv, r, _ref

      hsv = Convert.rgbToHSV(rgba.r, rgba.g, rgba.b)
      h = hsv.h * 100
      h += Math.abs(adjust)
      h = h % 100
      h /= 100
      hsv.h = h
      ;(_ref = Convert.hsvToRGB(hsv.h, hsv.s, hsv.v)), (r = _ref.r), (g = _ref.g), (b = _ref.b)
      rgba.r = r
      rgba.g = g
      rgba.b = b
      return rgba
    })
  }
  /**
   * 噪音
   * @param adjust
   * @returns
   */
  noise(adjust: number) {
    adjust = Math.abs(adjust) * 2.55
    return this.process('noise', function (rgba: Rgba_type) {
      let rand = Calculate.randomRange(adjust * -1, adjust)
      rgba.r += rand
      rgba.g += rand
      rgba.b += rand
      return rgba
    })
  }

  /**
   * 锐化
   * @param adjust
   * @returns
   */
  // stackBlur(adjust: number) {
  //   let radius = adjust
  //   const mul_table = [
  //     512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475,
  //     456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475,
  //     465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422,
  //     417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475,
  //     470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304,
  //     302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259
  //   ]
  //   const shg_table = [
  //     9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
  //     20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
  //     22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  //     23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  //     24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24
  //   ]

  //   var b_in_sum,
  //     b_out_sum,
  //     b_sum,
  //     div,
  //     g_in_sum,
  //     g_out_sum,
  //     g_sum,
  //     height,
  //     heightMinus1,
  //     i,
  //     mul_sum,
  //     p,
  //     pb,
  //     pg,
  //     pixels,
  //     pr,
  //     r_in_sum,
  //     r_out_sum,
  //     r_sum,
  //     radiusPlus1,
  //     rbs,
  //     shg_sum,
  //     stack,
  //     stackEnd,
  //     stackIn,
  //     stackOut,
  //     stackStart,
  //     sumFactor,
  //     w4,
  //     width,
  //     widthMinus1,
  //     x,
  //     y,
  //     yi,
  //     yp,
  //     yw,
  //     _i,
  //     _j,
  //     _k,
  //     _l,
  //     _m,
  //     _n,
  //     _o,
  //     _p,
  //     _q

  //   if (isNaN(radius) || radius < 1) {
  //     return
  //   }
  //   radius |= 0
  //   pixels = this.pixelData || []
  //   width = this.canvas?.width || 0
  //   height = this.canvas?.height || 0
  //   div = radius + radius + 1
  //   w4 = width << 2
  //   widthMinus1 = width - 1
  //   heightMinus1 = height - 1
  //   radiusPlus1 = radius + 1
  //   sumFactor = (radiusPlus1 * (radiusPlus1 + 1)) / 2
  //   stackStart = new BlurStack()
  //   stack = stackStart
  //   for (i = _i = 1; div >= 1 ? _i < div : _i > div; i = div >= 1 ? ++_i : --_i) {
  //     stack = stack.next = new BlurStack()
  //     if (i === radiusPlus1) {
  //       stackEnd = stack
  //     }
  //   }
  //   stack.next = stackStart
  //   stackIn = null
  //   stackOut = new BlurStack()
  //   yw = yi = 0
  //   mul_sum = mul_table[radius]
  //   shg_sum = shg_table[radius]
  //   for (y = _j = 0; height >= 0 ? _j < height : _j > height; y = height >= 0 ? ++_j : --_j) {
  //     r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0
  //     r_out_sum = radiusPlus1 * (pr = pixels[yi])
  //     g_out_sum = radiusPlus1 * (pg = pixels[yi + 1])
  //     b_out_sum = radiusPlus1 * (pb = pixels[yi + 2])
  //     r_sum += sumFactor * pr
  //     g_sum += sumFactor * pg
  //     b_sum += sumFactor * pb
  //     stack = stackStart
  //     for (i = _k = 0; radiusPlus1 >= 0 ? _k < radiusPlus1 : _k > radiusPlus1; i = radiusPlus1 >= 0 ? ++_k : --_k) {
  //       stack.r = pr
  //       stack.g = pg
  //       stack.b = pb
  //       stack = stack.next
  //     }
  //     for (i = _l = 1; radiusPlus1 >= 1 ? _l < radiusPlus1 : _l > radiusPlus1; i = radiusPlus1 >= 1 ? ++_l : --_l) {
  //       p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2)
  //       r_sum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i)
  //       g_sum += (stack.g = pg = pixels[p + 1]) * rbs
  //       b_sum += (stack.b = pb = pixels[p + 2]) * rbs
  //       r_in_sum += pr
  //       g_in_sum += pg
  //       b_in_sum += pb
  //       stack = stack.next
  //     }
  //     stackIn = stackStart
  //     stackOut = stackEnd
  //     for (x = _m = 0; width >= 0 ? _m < width : _m > width; x = width >= 0 ? ++_m : --_m) {
  //       pixels[yi] = (r_sum * mul_sum) >> shg_sum
  //       pixels[yi + 1] = (g_sum * mul_sum) >> shg_sum
  //       pixels[yi + 2] = (b_sum * mul_sum) >> shg_sum
  //       r_sum -= r_out_sum
  //       g_sum -= g_out_sum
  //       b_sum -= b_out_sum
  //       r_out_sum -= stackIn.r
  //       g_out_sum -= stackIn.g
  //       b_out_sum -= stackIn.b
  //       p = (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2
  //       r_in_sum += stackIn.r = pixels[p]
  //       g_in_sum += stackIn.g = pixels[p + 1]
  //       b_in_sum += stackIn.b = pixels[p + 2]
  //       r_sum += r_in_sum
  //       g_sum += g_in_sum
  //       b_sum += b_in_sum
  //       stackIn = stackIn.next
  //       r_out_sum += pr = stackOut.r
  //       g_out_sum += pg = stackOut.g
  //       b_out_sum += pb = stackOut.b
  //       r_in_sum -= pr
  //       g_in_sum -= pg
  //       b_in_sum -= pb
  //       stackOut = stackOut.next
  //       yi += 4
  //     }
  //     yw += width
  //   }
  //   for (x = _n = 0; width >= 0 ? _n < width : _n > width; x = width >= 0 ? ++_n : --_n) {
  //     g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0
  //     yi = x << 2
  //     r_out_sum = radiusPlus1 * (pr = pixels[yi])
  //     g_out_sum = radiusPlus1 * (pg = pixels[yi + 1])
  //     b_out_sum = radiusPlus1 * (pb = pixels[yi + 2])
  //     r_sum += sumFactor * pr
  //     g_sum += sumFactor * pg
  //     b_sum += sumFactor * pb
  //     stack = stackStart
  //     for (i = _o = 0; radiusPlus1 >= 0 ? _o < radiusPlus1 : _o > radiusPlus1; i = radiusPlus1 >= 0 ? ++_o : --_o) {
  //       stack.r = pr
  //       stack.g = pg
  //       stack.b = pb
  //       stack = stack.next
  //     }
  //     yp = width
  //     for (i = _p = 1; radius >= 1 ? _p <= radius : _p >= radius; i = radius >= 1 ? ++_p : --_p) {
  //       yi = (yp + x) << 2
  //       r_sum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i)
  //       g_sum += (stack.g = pg = pixels[yi + 1]) * rbs
  //       b_sum += (stack.b = pb = pixels[yi + 2]) * rbs
  //       r_in_sum += pr
  //       g_in_sum += pg
  //       b_in_sum += pb
  //       stack = stack.next
  //       if (i < heightMinus1) {
  //         yp += width
  //       }
  //     }
  //     yi = x
  //     stackIn = stackStart
  //     stackOut = stackEnd
  //     for (y = _q = 0; height >= 0 ? _q < height : _q > height; y = height >= 0 ? ++_q : --_q) {
  //       p = yi << 2
  //       pixels[p] = (r_sum * mul_sum) >> shg_sum
  //       pixels[p + 1] = (g_sum * mul_sum) >> shg_sum
  //       pixels[p + 2] = (b_sum * mul_sum) >> shg_sum
  //       r_sum -= r_out_sum
  //       g_sum -= g_out_sum
  //       b_sum -= b_out_sum
  //       r_out_sum -= stackIn.r
  //       g_out_sum -= stackIn.g
  //       b_out_sum -= stackIn.b
  //       p = (x + ((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width) << 2
  //       r_sum += r_in_sum += stackIn.r = pixels[p]
  //       g_sum += g_in_sum += stackIn.g = pixels[p + 1]
  //       b_sum += b_in_sum += stackIn.b = pixels[p + 2]
  //       stackIn = stackIn.next
  //       r_out_sum += pr = stackOut.r
  //       g_out_sum += pg = stackOut.g
  //       b_out_sum += pb = stackOut.b
  //       r_in_sum -= pr
  //       g_in_sum -= pg
  //       b_in_sum -= pb
  //       stackOut = stackOut.next
  //       yi += width
  //     }
  //   }
  //   return this
  // }

  /**
   * 执行处理camera方法
   * @param type 执行类型
   * @param func 对应的函数
   * @returns
   */
  process(type: string, func: (rgba: Rgba_type) => Rgba_type) {
    this.processMap.set(type, func)
    return this
  }

  runProcess(callback: Function) {
    if (!this.originImgData || !this.pixelData) {
      return
    }
    const mapKeys = this.processMap.keys()

    const { data } = this.originImgData

    for (const key of mapKeys) {
      const func = this.processMap.get(key)
      if (func) {
        for (let i = 0; i < data.length; i += 4) {
          const rgba = func.call(this, {
            r: this.pixelData[i],
            g: this.pixelData[i + 1],
            b: this.pixelData[i + 2],
            a: this.pixelData[i + 3]
          })

          this.pixelData[i] = rgba.r
          this.pixelData[i + 1] = rgba.g
          this.pixelData[i + 2] = rgba.b
          this.pixelData[i + 3] = rgba.a
        }
      }
    }
    callback()
  }

  /**
   * 渲染
   * @param callback
   * @returns
   */
  render(callback: Function) {
    const _this = this

    if (callback == null) {
      callback = function () {}
    }
    this.runProcess(function () {
      if (_this.canvas && _this.context && _this.pixelData) {
        const _imageData = new ImageData(_this.pixelData, _this.canvas.width, _this.canvas.height)
        _this.context.putImageData(_imageData, 0, 0)
        _this.copyImageData()
      }
    })
    return callback.call(_this)
  }

  /**
   * reset change
   */
  reset() {
    if (this.canvas && this.originImgData) {
      this.canvas.getContext('2d')?.putImageData(this.originImgData, 0, 0)
    }
  }
}

// convert转换
const Convert = {
  hsvToRGB(h: number, s: number, v: number) {
    let b: any, f, g: any, i, p, q, r: any, t

    i = Math.floor(h * 6)
    f = h * 6 - i
    p = v * (1 - s)
    q = v * (1 - f * s)
    t = v * (1 - (1 - f) * s)
    switch (i % 6) {
      case 0:
        r = v
        g = t
        b = p
        break
      case 1:
        r = q
        g = v
        b = p
        break
      case 2:
        r = p
        g = v
        b = t
        break
      case 3:
        r = p
        g = q
        b = v
        break
      case 4:
        r = t
        g = p
        b = v
        break
      case 5:
        r = v
        g = p
        b = q
    }
    return {
      r: Math.floor(r * 255),
      g: Math.floor(g * 255),
      b: Math.floor(b * 255)
    }
  },

  rgbToHSV(r: number, g: number, b: number) {
    let d, h: any, max, min, s, v

    r /= 255
    g /= 255
    b /= 255
    max = Math.max(r, g, b)
    min = Math.min(r, g, b)
    v = max
    d = max - min
    s = max === 0 ? 0 : d / max
    if (max === min) {
      h = 0
    } else {
      h = (function () {
        switch (max) {
          case r:
            return (g - b) / d + (g < b ? 6 : 0)
          case g:
            return (b - r) / d + 2
          case b:
            return (r - g) / d + 4
        }
      })()
      h /= 6
    }
    return {
      h: h,
      s: s,
      v: v
    }
  },

  rgbToXYZ(r: number, g: number, b: number) {
    var x, y, z

    r /= 255
    g /= 255
    b /= 255
    if (r > 0.04045) {
      r = Math.pow((r + 0.055) / 1.055, 2.4)
    } else {
      r /= 12.92
    }
    if (g > 0.04045) {
      g = Math.pow((g + 0.055) / 1.055, 2.4)
    } else {
      g /= 12.92
    }
    if (b > 0.04045) {
      b = Math.pow((b + 0.055) / 1.055, 2.4)
    } else {
      b /= 12.92
    }
    x = r * 0.4124 + g * 0.3576 + b * 0.1805
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = r * 0.0193 + g * 0.1192 + b * 0.9505
    return {
      x: x * 100,
      y: y * 100,
      z: z * 100
    }
  },

  xyzToRGB(x: number, y: number, z: number) {
    var b, g, r

    x /= 100
    y /= 100
    z /= 100
    r = 3.2406 * x + -1.5372 * y + -0.4986 * z
    g = -0.9689 * x + 1.8758 * y + 0.0415 * z
    b = 0.0557 * x + -0.204 * y + 1.057 * z
    if (r > 0.0031308) {
      r = 1.055 * Math.pow(r, 0.4166666667) - 0.055
    } else {
      r *= 12.92
    }
    if (g > 0.0031308) {
      g = 1.055 * Math.pow(g, 0.4166666667) - 0.055
    } else {
      g *= 12.92
    }
    if (b > 0.0031308) {
      b = 1.055 * Math.pow(b, 0.4166666667) - 0.055
    } else {
      b *= 12.92
    }
    return {
      r: r * 255,
      g: g * 255,
      b: b * 255
    }
  }
}

const Calculate = {
  randomRange(min: number, max: number, getFloat?: any) {
    var rand

    if (getFloat == null) {
      getFloat = false
    }
    rand = min + Math.random() * (max - min)
    if (getFloat) {
      return parseFloat(rand.toFixed(getFloat))
    } else {
      return Math.round(rand)
    }
  }
}

export default camera
