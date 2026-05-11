# INFO

Веб-платформа для публикации, чтения и продвижения цифровых комиксов. Проект включает клиентское приложение, серверную часть, личные кабинеты пользователей и авторов, каталог комиксов, блог, уведомления, комментарии, избранное, историю чтения и авторскую аналитику.

## Возможности

- регистрация, авторизация и подтверждение электронной почты;
- вход через социальные провайдеры;
- публикация комиксов с обложкой, баннером, главами и возрастным рейтингом;
- каталог комиксов с фильтрацией по жанрам и тегам;
- чтение глав с сохранением прогресса;
- лайки, избранное, оценки и комментарии;
- блог авторов и публикация новостей;
- уведомления через WebSocket;
- аналитика автора и экспорт отчета;
- REST API с документацией Swagger.

## Стек

### Backend

- Python;
- Django 5;
- Django REST Framework;
- Django Channels;
- Simple JWT;
- django-allauth;
- drf-spectacular;
- PostgreSQL;
- S3-совместимое хранилище для файлов;
- openpyxl для экспорта отчетов.

### Frontend

- React 18;
- TypeScript;
- Vite;
- Ant Design;
- React Query;
- React Router;
- Zustand;
- Styled Components;
- TipTap;
- Vitest;
- Cypress.

## Структура проекта

```text
diplom/
├── backend/              # Django-приложение и REST API
│   ├── analytics/        # аналитика автора
│   ├── authentication/   # регистрация, вход, токены, social auth
│   ├── blog/             # блог и комментарии к постам
│   ├── comics/           # комиксы, главы, каталог, прогресс чтения
│   ├── core/             # настройки, маршруты, ASGI/WSGI
│   ├── interactions/     # уведомления, реакции, WebSocket
│   ├── users/            # пользователи и профили
│   └── requirements.txt
└── frontend/             # React-приложение
    ├── cypress/          # E2E-тесты
    ├── src/              # исходный код клиента
    ├── package.json
    └── vite.config.ts
```

## Требования

- Python 3.11 или новее;
- Node.js 22 или новее;
- Yarn;
- PostgreSQL;
- доступ к S3-совместимому хранилищу для загрузки изображений и файлов.


## Запуск backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata comics/fixtures/genre_tag.json
python manage.py loaddata comics/fixtures/age_rating_categories.json
python manage.py createsuperuser
python manage.py runserver
```

## Запуск frontend

```bash
cd frontend
yarn install
yarn dev
```

## Тестирование

### Backend

Запуск всех backend-тестов:

```bash
cd backend
python manage.py test
```

Запуск тестов выбранных приложений:

```bash
python manage.py runprojecttests blog users comics
```

### Frontend

Unit-тесты и покрытие:

```bash
cd frontend
yarn test
```

Проверка типов:

```bash
yarn type-check
```

Линтинг:

```bash
yarn lint
```

E2E-тесты Cypress:

```bash
yarn test:e2e
```

Запуск frontend-сервера и E2E-тестов одной командой:

```bash
yarn test:server
```

