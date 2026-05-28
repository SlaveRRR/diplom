import {
  buildAuthPath,
  consumePendingAuthRedirect,
  getCurrentRelativeUrl,
  getIntentFromSearch,
  getIntentLabel,
  getRedirectFromSearch,
  getSafeAuthRedirect,
  storePendingAuthRedirect,
} from './authRedirect';

describe('authRedirect utils', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test('возвращает подпись для намерения и запасного значения', () => {
    expect(getIntentLabel('comment')).toBe('оставить комментарий');
    expect(getIntentLabel('unknown')).toBe('продолжить действие');
    expect(getIntentLabel(null)).toBeNull();
  });

  test('собирает текущий относительный адрес', () => {
    expect(getCurrentRelativeUrl('/catalog', '?genre=1', '#top')).toBe('/catalog?genre=1#top');
  });

  test('валидирует перенаправление и отбрасывает страницы авторизации и внешние адреса', () => {
    expect(getSafeAuthRedirect('/catalog?genre=1')).toBe('/catalog?genre=1');
    expect(getSafeAuthRedirect('/signin?redirect=/blog')).toBe('/');
    expect(getSafeAuthRedirect('/signup')).toBe('/');
    expect(getSafeAuthRedirect('https://evil.test')).toBe('/');
    expect(getSafeAuthRedirect(null)).toBe('/');
  });

  test('строит путь авторизации с перенаправлением и намерением', () => {
    expect(buildAuthPath('/signin', { intent: 'favorite', redirectTo: '/comics/1' })).toBe(
      '/signin?redirect=%2Fcomics%2F1&intent=favorite',
    );
    expect(buildAuthPath('/signup')).toBe('/signup');
  });

  test('читает перенаправление и намерение из строки запроса', () => {
    expect(getRedirectFromSearch('?redirect=%2Fblog%2F11&intent=create')).toBe('/blog/11');
    expect(getIntentFromSearch('?redirect=%2Fblog%2F11&intent=create')).toBe('create');
  });

  test('сохраняет и одноразово использует ожидающее перенаправление', () => {
    storePendingAuthRedirect('/analytics');

    expect(window.sessionStorage.getItem('auth-pending-redirect')).toBe('/analytics');
    expect(consumePendingAuthRedirect()).toBe('/analytics');
    expect(window.sessionStorage.getItem('auth-pending-redirect')).toBeNull();
  });

  test('очищает ожидающее перенаправление для небезопасного пути', () => {
    window.sessionStorage.setItem('auth-pending-redirect', '/catalog');

    storePendingAuthRedirect('/signin');

    expect(window.sessionStorage.getItem('auth-pending-redirect')).toBeNull();
  });
});
