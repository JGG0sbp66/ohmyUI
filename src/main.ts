import { createPinia } from "pinia";
import { createApp } from "vue";

import { ThemeRuntime, themeRuntimeKey, useThemeStore } from "@/theme";

import App from "./App.vue";

import "./styles/index.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const themeRuntime = new ThemeRuntime(useThemeStore(pinia), document);
themeRuntime.initialize();
app.provide(themeRuntimeKey, themeRuntime);

app.mount("#app");
