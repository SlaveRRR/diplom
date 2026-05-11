import os
from pathlib import Path


def clear_startup_log(base_dir):
    should_clear = os.getenv('CLEAR_LOG_ON_START', 'true').lower() == 'true'
    if not should_clear:
        return

    log_path = Path(base_dir) / 'logs' / 'django.log'
    log_path.parent.mkdir(exist_ok=True)
    log_path.write_text('', encoding='utf-8')
