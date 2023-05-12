// import Camera from "./camera";

// type raba = {
//   r: number;
//   g: number;
//   b: number;
//   a: number;
// };

// const camera = new Camera();

// /**
//  * 将事件加入执行队列
//  * @param type
//  * @param func
//  */
// const process = (type: string, func: Function) => {
//   camera.add(type, func);
// };

// /**
//  * 执行队列
//  */
// const render = (imgData: ImageData, func: Function): ImageData => {
//   camera.render();
//   return imgData;
// };

// // 亮度

// /**
//  *
//  * @param adjust
//  * @returns
//  */
// export const brightness = (adjust: number) => {
//   adjust = Math.floor(255 * (adjust / 100));
//   return process("brightness", function (rgba: raba) {
//     rgba.r += adjust;
//     rgba.g += adjust;
//     rgba.b += adjust;
//     return rgba;
//   });
// };
// // 对比度
// export const contrast = () => {};
// // 饱和值
// export const saturation = () => {};
// // 色调
// export const hue = () => {};
// // 噪音
// export const noise = () => {};
// // 锐化
// export const sharpen = () => {};

// /**
//  * 获取imgData像素点数据
//  * @param canvas
//  */
// export const getCanvasImgData = (canvas: HTMLCanvasElement) => {
//   const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
//   return ctx.getImageData(0, 0, canvas.width, canvas.height);
// };
