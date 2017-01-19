import Vue from 'vue';
import Router from 'vue-router';

import App from './App';
import routes from './routes';
import Locale from './locale';

Locale.use('zh-CN');

Vue.use(Router);
Vue.config.debug = true;

const router = new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes
});

new Vue({
  router,
  ...App
}).$mount('#app');
