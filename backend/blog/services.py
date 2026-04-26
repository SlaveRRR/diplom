from copy import deepcopy

from comics.services import S3UploadService, build_public_media_url, get_file_extension


def build_post_cover_key(user_id, post_draft_id, filename):
    return f'drafts/{user_id}/posts/{post_draft_id}/cover{get_file_extension(filename)}'


def build_post_inline_image_key(user_id, post_draft_id, upload_id, filename):
    return f'drafts/{user_id}/posts/{post_draft_id}/inline/{upload_id}{get_file_extension(filename)}'


def collect_post_image_sources(content):
    sources = []

    def walk(node):
        if isinstance(node, dict):
            if node.get('type') == 'image':
                attrs = node.get('attrs') or {}
                src = attrs.get('src')
                if src:
                    sources.append(src)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(content)
    return sources


def build_plain_text_excerpt(content, limit=220):
    chunks = []

    def walk(node):
        if isinstance(node, dict):
            if node.get('type') == 'text' and node.get('text'):
                chunks.append(node['text'])
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(content)
    plain_text = ' '.join(' '.join(chunks).split())
    if len(plain_text) <= limit:
        return plain_text
    return f"{plain_text[:limit].rstrip()}…"


def resolve_post_content_media(content):
    resolved = deepcopy(content)

    def walk(node):
        if isinstance(node, dict):
            if node.get('type') == 'image':
                attrs = node.setdefault('attrs', {})
                src = attrs.get('src')
                if src and not src.startswith(('http://', 'https://', 'blob:')):
                    attrs.setdefault('storageKey', src)
                    attrs['src'] = build_public_media_url(src)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(resolved)
    return resolved
