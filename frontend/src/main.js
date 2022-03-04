import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useStorage } from "vue3-storage";
import App from './App.vue'
import ClientRtc from './components/ClientRtc.vue'
import { io } from 'socket.io-client'

const routes = [
    {path:'/rtc', name: 'ClientRtc', component: ClientRtc},
    {path:'/', name: 'App', component: App}
];

const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHashHistory(),
    routes, // short for `routes: routes`
});

const storage = useStorage();
router.beforeEach((to, from) => {
    // ...
    // explicitly return false to cancel the navigation
    if(to.fullPath === "/" && from.fullPath === "/rtc"){
        // confirm box for user, when leaving session
        if(confirm("Press ok to leave session")){
            //pressed ok
            storage.clearStorageSync();
        }
        else{
            return { name: 'ClientRtc' };
        }
    }
    return true
})

const app = createApp(App);

let socket = io('http://localhost:3000');
app.provide("socket", socket);
app.provide("storage", storage);
app.use(router);

app.mount('#app');