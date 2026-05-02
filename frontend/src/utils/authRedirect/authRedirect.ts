const AUTH_REDIRECT_QUERY_PARAM = 'redirect';
const AUTH_INTENT_QUERY_PARAM = 'intent';
const AUTH_PENDING_REDIRECT_STORAGE_KEY = 'auth-pending-redirect';

// Не даём редиректить пользователя обратно на сами auth-страницы,
// иначе после входа можно случайно зациклить flow.
const AUTH_PAGES = new Set(['/signin', '/signup']);

export type AuthIntent = 'comment' | 'favorite' | 'follow' | 'like' | 'rate' | 'create' | 'library' | 'profile';

const intentLabels: Record<AuthIntent, string> = {
  comment: 'оставить комментарий',
  create: 'создать свой комикс',
  favorite: 'добавить тайтл в избранное',
  follow: 'подписаться на автора',
  library: 'открыть личную библиотеку',
  like: 'поставить лайк',
  rate: 'оставить оценку',
  profile: 'перейти в личный кабинет',
};

// Человекочитаемое описание действия нужно для UI-подсказок на signin/signup:
// пользователь видит, зачем именно его привели к авторизации.
export const getIntentLabel = (intent?: string | null) => {
  if (!intent) {
    return null;
  }

  return intentLabels[intent as AuthIntent] ?? 'продолжить действие';
};

export const getCurrentRelativeUrl = (pathname: string, search = '', hash = '') => `${pathname}${search}${hash}`;

// Валидируем redirect и оставляем только безопасный относительный путь внутри приложения.
// Это защищает от внешних URL и от возврата на /signin или /signup.
export const getSafeAuthRedirect = (redirect?: string | null) => {
  if (!redirect || !redirect.startsWith('/')) {
    return '/';
  }

  try {
    const parsed = new URL(redirect, window.location.origin);

    if (AUTH_PAGES.has(parsed.pathname)) {
      return '/';
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
};

// Собираем auth-URL с двумя видами контекста:
// 1. redirect — куда вернуть пользователя после входа;
// 2. intent — какое действие он пытался выполнить.
export const buildAuthPath = (
  pathname: '/signin' | '/signup',
  options?: {
    intent?: string | null;
    redirectTo?: string | null;
  },
) => {
  const params = new URLSearchParams();
  const redirect = getSafeAuthRedirect(options?.redirectTo);

  if (redirect !== '/') {
    params.set(AUTH_REDIRECT_QUERY_PARAM, redirect);
  }

  if (options?.intent) {
    params.set(AUTH_INTENT_QUERY_PARAM, options.intent);
  }

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
};

// Достаём redirect из query-параметров после перехода на signin/signup.
export const getRedirectFromSearch = (search: string) => {
  const params = new URLSearchParams(search);

  return getSafeAuthRedirect(params.get(AUTH_REDIRECT_QUERY_PARAM));
};

// Достаём intent из query-параметров, чтобы показать его в интерфейсе.
export const getIntentFromSearch = (search: string) => {
  const params = new URLSearchParams(search);

  return params.get(AUTH_INTENT_QUERY_PARAM);
};

// Отдельно кладём redirect в sessionStorage для social auth.
// Во время внешнего redirect через OAuth query-параметры могут потеряться,
// поэтому целевой экран дублируется во временное клиентское хранилище.
export const storePendingAuthRedirect = (redirectTo?: string | null) => {
  const redirect = getSafeAuthRedirect(redirectTo);

  if (redirect === '/') {
    window.sessionStorage.removeItem(AUTH_PENDING_REDIRECT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_PENDING_REDIRECT_STORAGE_KEY, redirect);
};

// Читаем сохранённый redirect один раз и сразу удаляем его,
// чтобы старое намерение не протекало в следующий auth-flow.
export const consumePendingAuthRedirect = () => {
  const redirect = window.sessionStorage.getItem(AUTH_PENDING_REDIRECT_STORAGE_KEY);

  if (redirect) {
    window.sessionStorage.removeItem(AUTH_PENDING_REDIRECT_STORAGE_KEY);
  }

  return getSafeAuthRedirect(redirect);
};
