import Vue from 'vue'
import App from './App.vue'
import http from './axios' // 追加

Vue.config.productionTip = false
Vue.prototype.$axios = http // 追加

new Vue({
  render: h => h(App),
}).$mount('#app')