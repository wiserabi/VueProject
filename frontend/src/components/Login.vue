<template>
    <div>
        <label for="userId">UserId: </label>
        <input type="text" v-model="inputId" @change="$emit('someEvent', this.inputId)"><br><br>
        <label for="password">Password: </label>
        <input type="text" id="password"><br><br>
    </div>
</template>

<script>

export default {
  name: 'Login',
  data() {
    return {
      inputId: ''
    }
  }
}
</script>