import Vue from 'vue'
import VueRouter from 'vue-router'
import Duels from '../views/Duel.vue'
import BlackJack from '../views/BlackJack'
import Leaderboard from '../views//Leaderboard'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Duels',
    icon: 'mdi-account-supervisor-circle',
    component: Duels
  },
  {
    path: '/blackjack',
    name: 'Black Jack',
    icon: 'mdi-cards-spade',
    component: BlackJack
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    icon: 'mdi-chart-bar',
    component: Leaderboard
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from ,next) => {
  document.title = `Gamble - ${to.name}`;
  next();
});

export default router
