from collections import deque
from html import escape

from django.conf import settings
from django.http import HttpResponse


def admin_logs_view(request):
    log_path = settings.LOG_DIR / 'django.log'
    line_count = int(request.GET.get('lines', 300))
    line_count = max(50, min(line_count, 1000))

    if log_path.exists():
        with log_path.open('r', encoding='utf-8', errors='replace') as log_file:
            lines = deque(log_file, maxlen=line_count)
        log_content = ''.join(lines).strip() or 'Лог-файл пока пуст.'
    else:
        log_content = 'Лог-файл еще не создан.'

    html = f"""
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>Журнал приложения</title>
        <style>
          :root {{
            --bg: #f4f7fb;
            --panel: #ffffff;
            --header: #18212f;
            --header-soft: #242f42;
            --accent: #6f72f6;
            --accent-hover: #8588ff;
            --text: #172033;
            --muted: #607089;
            --border: #dbe3ef;
            --log-bg: #111827;
            --log-text: #e5e7eb;
          }}

          * {{
            box-sizing: border-box;
          }}

          body {{
            margin: 0;
            font-family: Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
          }}

          header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            min-height: 64px;
            padding: 14px 28px;
            background: var(--header);
            color: #fff;
            box-shadow: 0 8px 24px rgba(24, 33, 47, 0.18);
          }}

          h1 {{
            margin: 0;
            font-size: 22px;
            line-height: 1.2;
            font-weight: 800;
          }}

          main {{
            padding: 28px 32px;
          }}

          .header-actions {{
            display: flex;
            align-items: center;
            gap: 10px;
          }}

          a {{
            color: var(--accent);
            text-decoration: none;
            font-weight: 700;
          }}

          a:hover {{
            color: var(--accent-hover);
          }}

          .header-actions a {{
            display: inline-flex;
            align-items: center;
            min-height: 32px;
            padding: 0 12px;
            border-radius: 6px;
            background: var(--accent);
            color: #ffffff;
          }}

          .header-actions a:hover {{
            background: var(--accent-hover);
            color: #ffffff;
          }}

          .panel {{
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--panel);
            box-shadow: 0 10px 24px rgba(24, 33, 47, 0.06);
          }}

          .panel-heading {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 16px 18px;
            background: var(--header-soft);
            color: #ffffff;
          }}

          .panel-heading h2 {{
            margin: 0;
            font-size: 16px;
          }}

          .panel-heading span {{
            color: #d7def2;
            font-size: 13px;
          }}

          .toolbar {{
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 14px 18px;
            border-bottom: 1px solid var(--border);
            background: #fbfcff;
          }}

          .toolbar a {{
            display: inline-flex;
            align-items: center;
            min-height: 30px;
            padding: 0 11px;
            border: 1px solid #cfd8ea;
            border-radius: 6px;
            background: #ffffff;
            color: #3c4860;
            font-size: 13px;
          }}

          .toolbar a:hover {{
            border-color: var(--accent);
            color: var(--accent);
          }}

          pre {{
            min-height: 420px;
            max-height: calc(100vh - 240px);
            margin: 0;
            padding: 18px;
            overflow: auto;
            white-space: pre-wrap;
            word-break: break-word;
            background: var(--log-bg);
            color: var(--log-text);
            border-radius: 0;
            line-height: 1.45;
            font-family: Consolas, "Courier New", monospace;
            font-size: 13px;
          }}

          .hint {{
            margin: 0 0 16px;
            color: var(--muted);
            font-size: 14px;
          }}
        </style>
      </head>
      <body>
        <header>
          <h1>Журнал приложения</h1>
          <div class="header-actions">
            <a href="/admin/">Админ-панель</a>
          </div>
        </header>
        <main>
          <p class="hint">
            Отображаются последние записи файла django.log. В журнал попадают API-запросы,
            серверные ошибки и служебные события Django.
          </p>
          <div class="panel">
            <div class="panel-heading">
              <h2>backend/logs/django.log</h2>
              <span>Показано до {line_count} строк</span>
            </div>
            <div class="toolbar">
              <a href="?lines=100">100 строк</a>
              <a href="?lines=300">300 строк</a>
              <a href="?lines=1000">1000 строк</a>
            </div>
            <pre>{escape(log_content)}</pre>
          </div>
        </main>
      </body>
    </html>
    """
    return HttpResponse(html)
