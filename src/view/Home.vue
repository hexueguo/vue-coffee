<template>
  <div class="root">
    <canvas id="drawPicture" width="1000" height="600">浏览器不支持 HTML5 canvas</canvas>

    <div class="slider-menu">
      <div v-for="(item, index) in configs" :key="index" class="slider-item">
        <span class="label">{{ item.name }}</span>
        <a-slider class="slider" v-model:value="item.value" :min="item.min" :max="item.max" :step="item.step" @change="sliderChange(item)"></a-slider>
      </div>
    </div>

    <a-button type="primary" @click="reset">重置</a-button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Camera from '../utils/camera'
import girl from '../assets/girl.jpg'
import { PICTURE_TYPE } from './const'

type config = {
  name: string
  props: string
  value: number
  initValue: number
  min: number
  max: number
  step?: number
  [key: string]: any
}

let canvas: HTMLCanvasElement
let camera: any

const configs = ref<Array<config>>([
  {
    name: '亮度',
    props: PICTURE_TYPE.brightness,
    value: 0,
    initValue: 0,
    min: -100,
    max: 100
  },
  {
    name: '对比度',
    props: PICTURE_TYPE.contrast,
    value: 0,
    initValue: 0,
    min: -100,
    max: 100
  },
  {
    name: '饱和值',
    props: PICTURE_TYPE.saturation,
    value: 0,
    initValue: 0,
    min: -100,
    max: 100
  },
  {
    name: '色调',
    props: PICTURE_TYPE.hue,
    value: 0,
    initValue: 0,
    min: 0,
    max: 100
  },
  {
    name: '噪音',
    props: PICTURE_TYPE.noise,
    value: 0,
    initValue: 0,
    min: 0,
    max: 100
  },
  {
    name: '伽马',
    props: PICTURE_TYPE.gamma,
    value: 1,
    initValue: 1,
    min: 0.1,
    max: 3,
    step: 0.1
  }

  // {
  //   name: "锐化",
  //   props: PICTURE_TYPE.sharpen,
  //   value: 0,
  //   min: 0,
  //   max: 100,
  // },
])

const sliderChange = (item: config) => {
  if (typeof camera[item.props] === 'function') {
    camera[item.props](item.value)
  }
  camera.render()
}

const reset = () => {
  configs.value.forEach((item) => {
    item.value = item.initValue
  })
  camera.reset()
}

/**
 * 初始化
 */
const initCanvas = () => {
  canvas = document.getElementById('drawPicture') as HTMLCanvasElement

  // canvas = document.createElement("canvas");
  // parentNode?.appendChild(canvas);

  const ctx = canvas.getContext('2d')

  const img = new Image()
  console.log('[ girl ] >', girl, canvas.width, canvas.height)
  img.src = girl
  // img.src = "../assets/girl.jpg"
  // img.src = "https://images.pexels.com/photos/12488389/pexels-photo-12488389.jpeg";
  img.onload = () => {
    // ctx?.drawImage(img, 0, 0);
    ctx?.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height)
    camera = new Camera('drawPicture')
  }
}

onMounted(() => {
  initCanvas()
})
</script>

<style scoped lang="scss">
.root {
  margin: auto;

  .slider-menu {
    .label {
      width: 80px;
      text-align: right;
    }
    .slider-item {
      margin: auto;
      padding: 10px 0;
      width: 500px;
      display: flex;
      align-items: center;
      .slider {
        flex: 1;
        margin-left: 16px;
      }
    }
  }
}
</style>
