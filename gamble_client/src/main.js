import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify';
import store from './store'
import axios from 'axios'
import VueSocketIO from 'vue-socket.io';

const  base_url               = 'http://192.168.0.18:3000'
       axios.defaults.baseURL = base_url + "/api/";

// Socket
Vue.use(new VueSocketIO({
  debug: true,
  connection: base_url,
  vuex: {
    store,
    actionPrefix: "SOCKET_",
    mutationPrefix: "SOCKET_"
  }
}));

Vue.config.productionTip = false

new Vue({
  router,
  vuetify,
  store,
  render: h => h(App)
}).$mount('#app')
