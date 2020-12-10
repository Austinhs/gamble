import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    username   : '',
    id         : null,
    rank       : null,
    money      : 0,
    pending_bet: 0,
    token      : ''
  },
  mutations: {
    SET_LOGGED_IN(state, payload) {
      localStorage.setItem('token', payload.token);
      axios.defaults.headers = {
        "auth-token": payload.token,
      };

      state.username    = payload.username;
      state.id          = payload._id;
      state.rank        = payload.rank;
      state.money       = payload.money;
      state.pending_bet = payload.pending_bet ? payload.pending_bet : 0;
      state.token       = payload.token;
    },

    ADD_PENDING_BET(state, amount) {
      state.pending_bet += Number(amount);
    },

    SET_STATS(state, payload) {
      state.rank        = payload.rank,
      state.money       = payload.money,
      state.pending_bet = payload.pending_bet
    },

    SET_PENDING_BET(state, amount) {
      state.pending_bet = Number(amount);
    },

    SET_MONEY(state, amount) {
      state.money = Number(amount);
    },
  },
  actions: {
  },
  modules: {
  }
})
