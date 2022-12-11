<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <br>
    <button @click="onPressBtn">ボタン</button>
    <!-- <p>{{ result }}</p> -->
    <div id="displayArea"></div>
    <HelloWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  async created() {
    await this.$axios.get('/message').then((res) => {
      console.log(res.data)
    })
  },
  data() {
    return {
      result: "aa"
    }
  },
  methods: {
    onPressBtn() {
      this.$axios.get('/getData').then((res) => {
        const data = res.data;
        const displayArea = document.getElementById('displayArea');
        for (let i = 0; i < data.length; i++) {
          const para = document.createElement('p');
          para.innerText = `${data[i].start}, ${data[i].end}`;
          displayArea.appendChild(para);
        }
      })
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
