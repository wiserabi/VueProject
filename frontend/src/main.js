import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import ClientRtc from './components/ClientRtc.vue'
// import Login from './components/Login.vue'

const routes = [
    {path:'/rtc/:userId', name: 'ClientRtc', component: ClientRtc},
    {path:'/', name: 'App', component: App}
];

const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHashHistory(),
    routes, // short for `routes: routes`
  });

const app = createApp(App);

app.use(router);
app.mount('#app');
