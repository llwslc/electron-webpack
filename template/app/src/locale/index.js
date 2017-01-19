
let lang = 'zh-CN';

import Vue from 'vue';
import Format from './format';

const format = Format(Vue);
let langObj = {};

export const t = function(path, options) {
  const array = path.split('.');
  let current = langObj;

  for (var i = 0, j = array.length; i < j; i++) {
    var property = array[i];
    var value = current[property];
    if (i === j - 1) return format(value, options);
    if (!value) return '';
    current = value;
  }
  return '';
};

export const use = function(l) {
  lang = l || lang;
  langObj = require(`./lang/${lang}`).default;
};
export default { use, t };
