/**
 * 路由配置
 * 
 * 页面路由：
 * - / : 书架首页
 * - /library : 书城（在线搜索）
 * - /reader/:bookId : 阅读器
 * - /reader/:bookId/chapter/:chapterId : 指定章节阅读
 * - /sources : 书源管理
 * - /settings : 设置
 */

import { createRouter, createWebHistory } from 'vue-router';
import ShelfView from '@/views/ShelfView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'shelf',
      component: ShelfView,
      meta: { title: '我的书架' }
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('@/views/LibraryView.vue'),
      meta: { title: '书城' }
    },
    {
      path: '/reader/:bookId',
      name: 'reader',
      component: () => import('@/views/ReaderView.vue'),
      meta: { title: '阅读中' },
      props: true
    },
    {
      path: '/reader/:bookId/chapter/:chapterId',
      name: 'reader-chapter',
      component: () => import('@/views/ReaderView.vue'),
      meta: { title: '阅读中' },
      props: true
    },
    {
      path: '/sources',
      name: 'sources',
      component: () => import('@/views/SourceView.vue'),
      meta: { title: '书源管理' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: '设置' }
    }
  ]
});

/**
 * 路由守卫 - 设置页面标题
 */
router.beforeEach((to, from, next) => {
  document.title = to.meta.title as string || '小说阅读器';
  next();
});

export default router;
