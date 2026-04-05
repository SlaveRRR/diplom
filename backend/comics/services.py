from pathlib import Path

import boto3
from botocore.client import Config
from django.conf import settings


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
