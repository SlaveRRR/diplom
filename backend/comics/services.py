from pathlib import Path

import boto3
from botocore.client import Config
from django.conf import settings


ALLOWED_IMAGE_CONTENT_TYPES = {
    'image/jpeg': {'.jpg', '.jpeg'},
    'image/jpg': {'.jpg', '.jpeg'},
    'image/png': {'.png'},
    'image/webp': {'.webp'},
}
IMAGE_MAGIC_BYTES = {
    'image/jpeg': (b'\xff\xd8\xff',),
    'image/jpg': (b'\xff\xd8\xff',),
    'image/png': (b'\x89PNG\r\n\x1a\n',),
}


class ImageUploadValidationError(ValueError):
    pass


def normalize_content_type(content_type):
    return (content_type or '').split(';', 1)[0].strip().lower()


def validate_image_upload_metadata(filename, content_type):
    normalized_content_type = normalize_content_type(content_type)
    extension = get_file_extension(filename)
    allowed_extensions = ALLOWED_IMAGE_CONTENT_TYPES.get(normalized_content_type)

    if not allowed_extensions:
        raise ImageUploadValidationError('Only PNG, JPG and WEBP images can be uploaded.')

    if extension not in allowed_extensions:
        raise ImageUploadValidationError('Image file extension does not match its content type.')


def is_valid_image_signature(content_type, chunk):
    normalized_content_type = normalize_content_type(content_type)

    if normalized_content_type == 'image/webp':
        return chunk.startswith(b'RIFF') and chunk[8:12] == b'WEBP'

    signatures = IMAGE_MAGIC_BYTES.get(normalized_content_type)
    return bool(signatures and any(chunk.startswith(signature) for signature in signatures))


class S3UploadService:
    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION_NAME,
            config=Config(signature_version='s3v4'),
        )

    def generate_upload(self, object_key, content_type):
        upload_url = self.client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.S3_BUCKET_NAME,
                'Key': object_key,
                'ContentType': content_type or 'application/octet-stream',
            },
            ExpiresIn=settings.S3_PRESIGNED_EXPIRATION,
        )
        return {
            'method': 'PUT',
            'key': object_key,
            'upload_url': upload_url,
        }

    def object_exists(self, object_key):
        try:
            self.client.head_object(Bucket=settings.S3_BUCKET_NAME, Key=object_key)
            return True
        except Exception:
            return False

    def validate_image_object(self, object_key):
        try:
            head = self.client.head_object(Bucket=settings.S3_BUCKET_NAME, Key=object_key)
            content_type = head.get('ContentType') or ''
            validate_image_upload_metadata(object_key, content_type)
            response = self.client.get_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=object_key,
                Range='bytes=0-31',
            )
            chunk = response['Body'].read(32)
            return is_valid_image_signature(content_type, chunk)
        except Exception:
            return False

    def delete_objects(self, object_keys):
        keys = [
            key
            for key in dict.fromkeys(object_keys)
            if key and not str(key).startswith(('http://', 'https://', 'blob:'))
        ]

        if not keys:
            return 0

        self.client.delete_objects(
            Bucket=settings.S3_BUCKET_NAME,
            Delete={
                'Objects': [{'Key': key} for key in keys],
                'Quiet': True,
            },
        )
        return len(keys)



def get_file_extension(filename):
    extension = Path(filename).suffix.lower()
    return extension or '.bin'



def build_comic_media_key(user_id, comic_draft_id, media_name, filename):
    return f'drafts/{user_id}/comics/{comic_draft_id}/{media_name}{get_file_extension(filename)}'



def build_chapter_page_key(user_id, comic_draft_id, chapter_draft_id, page_order, filename):
    return (
        f'drafts/{user_id}/comics/{comic_draft_id}/chapters/{chapter_draft_id}/'
        f'{page_order:03d}{get_file_extension(filename)}'
    )



def build_user_avatar_key(user_id, avatar_draft_id, filename):
    return f'users/{user_id}/avatars/{avatar_draft_id}{get_file_extension(filename)}'



def build_public_media_url(object_key):
    if not object_key:
        return ''

    if object_key.startswith(('http://', 'https://')):
        return object_key

    if not settings.S3_PUBLIC_BASE_URL:
        return object_key

    return f"{settings.S3_PUBLIC_BASE_URL.rstrip('/')}/{object_key.lstrip('/')}"
