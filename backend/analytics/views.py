from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.views import APIView

from analytics.models import AnalyticsEvent
from analytics.serializers import AnalyticsResponseSerializer
from analytics.services import (
    ALLOWED_INTERVALS,
    build_analytics_payload,
    build_excel_response,
    parse_date_range,
    validate_item_filter,
)
from core.api import error_response, success_response


class AnalyticsAccessMixin:
    def ensure_authenticated(self, user):
        if not getattr(user, 'is_authenticated', False):
            return error_response('Authentication credentials were not provided.', status.HTTP_401_UNAUTHORIZED)
        return None


class AnalyticsDashboardView(AnalyticsAccessMixin, APIView):
    @extend_schema(
        tags=['Analytics'],
        responses={200: AnalyticsResponseSerializer},
        parameters=[
            OpenApiParameter(name='contentType', type=str, required=False),
            OpenApiParameter(name='itemId', type=int, required=False),
            OpenApiParameter(name='dateFrom', type=str, required=False),
            OpenApiParameter(name='dateTo', type=str, required=False),
            OpenApiParameter(name='interval', type=str, required=False),
        ],
        summary='Get analytics dashboard payload for current author',
    )
    def get(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        content_type = request.query_params.get('contentType') or 'all'
        item_id_raw = request.query_params.get('itemId')
        interval = request.query_params.get('interval') or 'day'
        item_id = int(item_id_raw) if item_id_raw and item_id_raw.isdigit() else None

        if interval not in ALLOWED_INTERVALS:
            return error_response('Unsupported analytics interval.', status.HTTP_400_BAD_REQUEST)

        if content_type not in {'all', AnalyticsEvent.ContentKind.COMIC, AnalyticsEvent.ContentKind.POST}:
            return error_response('Unsupported analytics content type.', status.HTTP_400_BAD_REQUEST)

        date_from, date_to = parse_date_range(
            request.query_params.get('dateFrom'),
            request.query_params.get('dateTo'),
        )

        if item_id and content_type == 'all':
            return error_response('Item filter requires a specific content type.', status.HTTP_400_BAD_REQUEST)

        if item_id and not validate_item_filter(user=request.user, content_type=content_type, item_id=item_id):
            return error_response('Requested analytics item was not found.', status.HTTP_404_NOT_FOUND)

        payload = build_analytics_payload(
            user=request.user,
            content_type=content_type,
            item_id=item_id,
            date_from=date_from,
            date_to=date_to,
            interval=interval,
        )
        return success_response(AnalyticsResponseSerializer(payload).data, status.HTTP_200_OK)


class AnalyticsExportView(AnalyticsAccessMixin, APIView):
    @extend_schema(
        tags=['Analytics'],
        responses={200: {'type': 'string', 'format': 'binary'}},
        parameters=[
            OpenApiParameter(name='contentType', type=str, required=False),
            OpenApiParameter(name='itemId', type=int, required=False),
            OpenApiParameter(name='dateFrom', type=str, required=False),
            OpenApiParameter(name='dateTo', type=str, required=False),
            OpenApiParameter(name='interval', type=str, required=False),
        ],
        summary='Download analytics report in Excel format',
    )
    def get(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        content_type = request.query_params.get('contentType') or 'all'
        item_id_raw = request.query_params.get('itemId')
        interval = request.query_params.get('interval') or 'day'
        item_id = int(item_id_raw) if item_id_raw and item_id_raw.isdigit() else None

        if interval not in ALLOWED_INTERVALS:
            return error_response('Unsupported analytics interval.', status.HTTP_400_BAD_REQUEST)

        if content_type not in {'all', AnalyticsEvent.ContentKind.COMIC, AnalyticsEvent.ContentKind.POST}:
            return error_response('Unsupported analytics content type.', status.HTTP_400_BAD_REQUEST)

        date_from, date_to = parse_date_range(
            request.query_params.get('dateFrom'),
            request.query_params.get('dateTo'),
        )

        if item_id and content_type == 'all':
            return error_response('Item filter requires a specific content type.', status.HTTP_400_BAD_REQUEST)

        if item_id and not validate_item_filter(user=request.user, content_type=content_type, item_id=item_id):
            return error_response('Requested analytics item was not found.', status.HTTP_404_NOT_FOUND)

        payload = build_analytics_payload(
            user=request.user,
            content_type=content_type,
            item_id=item_id,
            date_from=date_from,
            date_to=date_to,
            interval=interval,
        )
        return build_excel_response(payload)
