export default [
  {
    path: '/',
    name: 'main-page',
    component: require('./components/mainPage'),
  },
  {
    path: '*',
    redirect: '/',
  },
];
