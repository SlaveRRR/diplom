from django.core.management import BaseCommand, call_command


class Command(BaseCommand):
    help = 'Run project tests for selected apps or the whole backend test suite.'

    def add_arguments(self, parser):
        parser.add_argument(
            'apps',
            nargs='*',
            help='Optional app labels to test, for example: authentication users',
        )

    def handle(self, *args, **options):
        apps = options['apps']

        if apps:
            self.stdout.write(self.style.NOTICE(f'Running tests for: {", ".join(apps)}'))
            call_command('test', *apps)
            return

        self.stdout.write(self.style.NOTICE('Running full backend test suite'))
        call_command('test')
