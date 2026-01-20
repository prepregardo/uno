// Полная модель данных для страницы обзора букмекера

export interface BookmakerReview {
  // Основная информация
  slug: string;
  name: string;
  logo: string;
  website: string;
  description: string;

  // Статистика
  stats: {
    reviewsCount: number;
    questionsCount: number;
    faqCount: number;
    complaintsTotal: number;
    complaintsResolved: number;
    viewsCount: number;
  };

  // Навигатор (боковая панель)
  navigator: {
    rating: number; // 8.4
    ratingOutOf: number; // 10
    category: string; // "БК России"
    bonus: string; // "30000 ₽"
    founded: number; // 2009
    license: string; // "ФНС России"
    minDeposit: string; // "100 ₽"
    onlineSupport: boolean;
  };

  // Оценки по категориям (редакционная оценка)
  ratings: {
    overall: number;
    categories: {
      name: string;
      value: number;
      maxValue: number;
    }[];
  };

  // Редакционный обзор
  editorialReview: {
    authorName: string;
    authorPhoto: string;
    authorPosition: string;
    rating: number;
    text: string;
    date: string;
  };

  // Бонусы
  bonuses: {
    id: string;
    title: string;
    description: string;
    amount: string;
    type: 'welcome' | 'freebet' | 'cashback' | 'promo';
    conditions: string;
    promoCode?: string;
    expiryDate?: string;
  }[];

  // FAQ
  faq: {
    question: string;
    answer: string;
  }[];

  // Приложения
  apps: {
    ios: {
      available: boolean;
      rating?: number;
      downloadUrl?: string;
      version?: string;
    };
    android: {
      available: boolean;
      rating?: number;
      downloadUrl?: string;
      version?: string;
    };
  };

  // Способы оплаты
  paymentMethods: {
    name: string;
    icon: string;
    type: 'card' | 'ewallet' | 'crypto' | 'bank' | 'mobile';
    depositMin?: string;
    depositMax?: string;
    withdrawMin?: string;
    withdrawMax?: string;
    depositTime?: string;
    withdrawTime?: string;
  }[];

  // Валюты
  currencies: string[];

  // Служба поддержки
  support: {
    phone?: string;
    email?: string;
    liveChat: boolean;
    workingHours?: string;
    telegram?: string;
    whatsapp?: string;
  };

  // Надёжность
  reliability: {
    licensesCount: number;
    yearsOnMarket: number;
    complaintsResolvedPercent: number;
    avgResponseTime?: string;
  };

  // Лицензии
  licenses: {
    name: string;
    number?: string;
    issuedBy: string;
    issuedDate?: string;
    validUntil?: string;
  }[];

  // Информация о компании
  company: {
    legalName: string;
    registrationNumber?: string;
    address?: string;
    country: string;
  };

  // Видеообзор
  videoReview?: {
    youtubeId: string;
    title: string;
    duration?: string;
  };

  // Основной контент (HTML)
  content: {
    intro: string;
    registration?: string;
    deposit?: string;
    withdrawal?: string;
    betting?: string;
    mobile?: string;
    support?: string;
    conclusion?: string;
  };

  // Плюсы и минусы
  pros: string[];
  cons: string[];

  // SEO
  seo: {
    title: string;
    description: string;
    keywords?: string[];
  };

  // Мета
  createdAt: string;
  updatedAt: string;
}

// Демо-отзывы пользователей
export interface UserReview {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  text: string;
  date: string;
  likes: number;
  replies: number;
  isVerified?: boolean;
}

// Демо-жалобы
export interface Complaint {
  id: string;
  userName: string;
  title: string;
  status: 'pending' | 'resolved' | 'rejected';
  date: string;
  amount?: string;
  category: string;
}

// Полные данные для страницы (включая демо-данные)
export interface BookmakerPageData extends BookmakerReview {
  demoReviews: UserReview[];
  demoComplaints: Complaint[];
}
