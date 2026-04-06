from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class AccessTokenResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()


class VerificationEmailResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    email = serializers.EmailField()
    retry_after = serializers.IntegerField()


class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')
        extra_kwargs = {
            'role': {'required': False},
        }

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError('Admin role cannot be assigned during sign up.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class SignInSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ResendVerificationEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
