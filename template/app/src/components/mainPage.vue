<style scoped>

</style>

<template>
  <div>
    <hello-page></hello-page>
  </div>
</template>

<script>
  import HelloPage from './pages/helloPage.vue';

  import Vue from 'vue';
  import Store from '../vuex/store';

  export default {
    components: {
      HelloPage,
    },

    beforeCreate() {

      global.Hello = require('../sections/helloJs');

      global.Vue = Vue;
      global.Store = Store;
    },

    name: 'MainPage',
  };
</script>
