<template>
  <img alt="Vue logo" src="./assets/logo.png" v-if="loggedOut">
  <Login v-if="loggedOut" @login-event="setId"/>
  <router-view v-if="!loggedOut"></router-view>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import Login from './components/Login.vue'

export default {
  name: 'App',
  components: {
    Login,
  },
  data(){
    return {
      loggedOut: true,
    }
  },
  methods: {
    setId(){
      this.$router.push("/rtc");
      this.loggedOut = false;
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
