import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';

// Список разрешённых email для доступа в админку
const ALLOWED_ADMINS = (process.env.ALLOWED_ADMINS || '').split(',').filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  callbacks: {
    async signIn({ user }) {
      // Если список админов пустой — разрешаем всем (для разработки)
      if (ALLOWED_ADMINS.length === 0) {
        return true;
      }
      // Проверяем, есть ли email в списке разрешённых
      return ALLOWED_ADMINS.includes(user.email || '');
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
