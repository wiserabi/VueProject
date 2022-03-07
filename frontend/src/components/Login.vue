<template>
    <div>
        <label for="userId">UserId: </label>
        <input type="text" v-model="inputId"><br><br>
        <label for="password">Password: </label>
        <input type="text" v-model="inputPass"><br><br>
        <button @click="validate">Login</button>
    </div>
</template>

<script>
import { inject } from 'vue'

export default {
  name: 'Login',
  socket: ['socket'],
  data() {
    return {
      inputId: '',
      inputPass: '',
      socket: inject('socket'),
      storage: inject('storage') 
    }
  },
  methods: {
    checkUserInDb(){
      let loggedIn = this.storage.getStorageSync(this.inputId);
      let expired = this.storage.isExpire(this.inputId);
      if(loggedIn === 'true' && !expired){
        this.$emit('loginEvent');
      }
      else if(expired){
        console.log("login session expired!");
      }
    },
    validate() {
      this.socket.emit('login', this.inputId, this.inputPass);
      this.checkUserInDb();
    }
  },
  mounted(){
    this.socket.on("validate", (userId, result) => {
      //로그인 성공시
      if(result){
        //storage에 저장 expires in 1 hour = 1000 * 60 * 60 milliseconds
        this.storage.setStorageSync(userId, "true", 1000 * 60 * 60);
        //로그인 이벤트를 방출
        this.$emit('loginEvent');
      }
      else{
        console.log("login failure!");
      }
    });
  }
}
</script>