from django.contrib import admin, messages
from django.utils import timezone

from core.moderation import MODERATION_STATUS_LABELS, notify_moderation_result, record_publication_event


class ModerationAdminMixin(admin.ModelAdmin):
    moderation_item_label = ''
    moderation_status_labels = MODERATION_STATUS_LABELS

    def formfield_for_choice_field(self, db_field, request, **kwargs):
        if db_field.name == 'status':
            kwargs['choices'] = [(value, label) for value, label in self.moderation_status_labels.items()]
        return super().formfield_for_choice_field(db_field, request, **kwargs)

    def get_moderation_link_path(self, obj):
        raise NotImplementedError

    def after_publish(self, obj):
        return None

    def save_model(self, request, obj, form, change):
        previous_status = None
        if change and obj.pk:
            previous_status = type(obj).objects.only('status', 'published_at').get(pk=obj.pk).status

        moderation_message = (getattr(obj, 'moderation_message', '') or '').strip()

        if getattr(obj, 'status', None) == 'published' and getattr(obj, 'published_at', None) is None:
            obj.published_at = timezone.now()

        super().save_model(request, obj, form, change)

        if getattr(obj, 'status', None) == 'published':
            self.after_publish(obj)
            if previous_status != obj.status:
                record_publication_event(
                    user=obj.author,
                    item_label=self.moderation_item_label,
                    object_id=obj.id,
                    title=obj.title,
                )

        if not change or previous_status == obj.status or obj.status not in {'published', 'revision', 'blocked'}:
            return

        try:
            notify_moderation_result(
                user=obj.author,
                item_label=self.moderation_item_label,
                title=obj.title,
                status=obj.status,
                link_path=self.get_moderation_link_path(obj),
                moderation_message=moderation_message,
            )
        except Exception as error:
            self.message_user(
                request,
                f'Статус сохранён, но уведомление автору отправить не удалось: {error}',
                level=messages.WARNING,
            )
