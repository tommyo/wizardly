import { createRouter, createWebHistory } from 'vue-router'
import ExampleApp from '../views/demo/ExampleApp.vue'
import AdminApp from '../views/demo/admin/AdminApp.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ExampleApp
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminApp
    }
  ]
})

export default router
