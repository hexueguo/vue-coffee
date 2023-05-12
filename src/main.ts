import { createApp } from "vue";
import AntdVue from "ant-design-vue";
import "./style.css";
import 'ant-design-vue/dist/antd.css';
import App from "./App.vue";

const vueApp = createApp(App);
vueApp.use(AntdVue);
vueApp.mount("#app");
