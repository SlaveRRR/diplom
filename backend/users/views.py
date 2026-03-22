from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.serializers import CurrentUserSerializer, UserUpdateSerializer


class CurrentUserView(APIView):
    @extend_schema(
        tags=['Users'],
        responses={200: CurrentUserSerializer},
        summary='Get current user profile',
    )
    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Users'],
        request=UserUpdateSerializer,
        responses={
            200: CurrentUserSerializer,
            400: OpenApiResponse(description='Invalid user payload'),
        },
        summary='Update current user profile',
    )
    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_serializer = CurrentUserSerializer(request.user)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
