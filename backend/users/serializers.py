from django.contrib.auth.models import User
from rest_framework import serializers


class UserUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='first_name', required=False, allow_blank=True)
    surname = serializers.CharField(source='last_name', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'surname')


class CurrentUserSerializer(serializers.ModelSerializer):
    active = serializers.BooleanField(source='is_active', read_only=True)
    name = serializers.SerializerMethodField()
    surname = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

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
            'role',
        )

    def get_name(self, obj):
        return obj.first_name

    def get_surname(self, obj):
        return obj.last_name

    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        if obj.is_staff:
            return 'moderator'
        return 'reader'
