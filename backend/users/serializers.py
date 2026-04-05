from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='first_name', required=False, allow_blank=True)
    surname = serializers.CharField(source='last_name', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'surname', 'avatar', 'role')
        read_only_fields = ('role',)


class CurrentUserSerializer(serializers.ModelSerializer):
    active = serializers.BooleanField(source='is_active', read_only=True)
    name = serializers.SerializerMethodField()
    surname = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'is_staff',
            'is_active',
            'is_superuser',
            'active',
            'name',
            'surname',
            'avatar',
            'role',
        )

    def get_name(self, obj):
        return obj.first_name

    def get_surname(self, obj):
        return obj.last_name
