import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'index',
		redirect: '/login',
	},
	{
		path: '/login',
		name: 'login',
		component: () => import('@/views/Login.vue'),
	},
	{
		path: '/dashboard',
		name: 'dashboard',
		component: () => import('@/views/Dashboard.vue')
	},
	{
		path: '/dns',
		name: 'dns',
		component: () => import('@/views/Dns.vue')
	},
	{
		path: '/usercenter',
		name: 'usercenter',
		component: () => import('@/views/UserCenter.vue')
	}
];

export default createRouter({
	history: createWebHistory(),
	routes,
});
