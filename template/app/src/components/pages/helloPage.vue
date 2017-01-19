<template>
  <div>
    <span>\{{ t('el.tree.emptyText') }}</span>
  </div>
</template>

<script>
  import Locale from './mixins/locale';

  export default {
    mixins: [Locale],

    computed: {
    },

    data() {
      return {
      }
    },

    methods: {
    },

    updated() {
    },

    mounted() {
{{#if fork}}
      var forkPath = '';
      if (process.env.NODE_ENV === 'developmentHot')
      {
        forkPath = 'app/src/sections/analyseResultFork.js';
      }
      else
      {
        forkPath = path.join(__curdirname, '/fork.js');
      }

      this.analyseProcess = childProcess.fork(forkPath);
      this.analyseProcess.on ("message", function (msg)
      {
        console.log(msg)
      });

      // this.analyseProcess.send({msg: true});
{{/if}}
    },
  };
</script>

<style lang="scss">
  @import "./assets/style/main-style";
</style>
