import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { createPinia } from 'pinia';
import 'element-plus/dist/index.css';
import 'nprogress/nprogress.css';
import './styles/global.css';
import App from './App.vue';
import { router } from './router';

// Element Plus 全局使用中文语言包，统一分页器的“条/页、前往、页”等内置文案。
createApp(App).use(createPinia()).use(router).use(ElementPlus, { locale: zhCn }).mount('#app');
