from copy import deepcopy

import json
import math

from comics.services import S3UploadService, build_public_media_url, get_file_extension


POST_CONTENT_MAX_JSON_BYTES = 512 * 1024
POST_CONTENT_MAX_DEPTH = 24
POST_CONTENT_MAX_NODES = 1500
POST_CONTENT_MAX_TEXT_LENGTH = 20000
POST_CONTENT_MAX_ATTR_LENGTH = 2000
POST_CONTENT_MAX_IMAGE_SIZE_PX = 10000

POST_CONTENT_ALLOWED_ALIGNMENTS = {'left', 'center', 'right', 'justify'}
POST_CONTENT_ALLOWED_NODES = {
    'blockquote',
    'bulletList',
    'doc',
    'hardBreak',
    'heading',
    'image',
    'listItem',
    'orderedList',
    'paragraph',
    'text',
}
POST_CONTENT_ALLOWED_MARKS = {'bold', 'highlight', 'italic'}
POST_CONTENT_ALLOWED_IMAGE_SIZE_UNITS = ('px', '%')


class PostContentValidationError(ValueError):
    pass


def validate_post_content_document(content):
    try:
        encoded = json.dumps(content, ensure_ascii=False, allow_nan=False)
    except (TypeError, ValueError) as exc:
        raise PostContentValidationError('Post content must be valid JSON.') from exc

    if len(encoded.encode('utf-8')) > POST_CONTENT_MAX_JSON_BYTES:
        raise PostContentValidationError('Post content is too large.')

    counters = {'nodes': 0}
    _validate_post_content_node(content, path='content', depth=0, counters=counters, allowed_context='doc')
    return content


def _validate_post_content_node(node, *, path, depth, counters, allowed_context):
    if depth > POST_CONTENT_MAX_DEPTH:
        raise PostContentValidationError(f'{path}: content tree is too deep.')
    if not isinstance(node, dict):
        raise PostContentValidationError(f'{path}: node must be an object.')

    node_type = node.get('type')
    if node_type not in POST_CONTENT_ALLOWED_NODES:
        raise PostContentValidationError(f'{path}: unsupported node type "{node_type}".')
    if allowed_context == 'doc' and node_type != 'doc':
        raise PostContentValidationError(f'{path}: root node must be "doc".')
    if allowed_context == 'inline' and node_type not in {'text', 'hardBreak'}:
        raise PostContentValidationError(f'{path}: node "{node_type}" is not allowed inside inline content.')
    if allowed_context == 'list' and node_type != 'listItem':
        raise PostContentValidationError(f'{path}: lists can contain only listItem nodes.')

    counters['nodes'] += 1
    if counters['nodes'] > POST_CONTENT_MAX_NODES:
        raise PostContentValidationError('Post content contains too many nodes.')

    allowed_keys = {'type', 'content', 'attrs', 'marks', 'text'}
    unexpected_keys = set(node) - allowed_keys
    if unexpected_keys:
        raise PostContentValidationError(f'{path}: unexpected keys: {", ".join(sorted(unexpected_keys))}.')

    attrs = node.get('attrs') or {}
    if node.get('attrs') is not None and not isinstance(node.get('attrs'), dict):
        raise PostContentValidationError(f'{path}.attrs: attrs must be an object.')

    if node_type == 'doc':
        _validate_attrs(attrs, allowed=set(), path=f'{path}.attrs')
        _validate_children(node.get('content', []), path=path, depth=depth, counters=counters, allowed_context='block')
        return

    if node_type == 'text':
        _validate_text_node(node, path=path)
        return

    if 'marks' in node:
        raise PostContentValidationError(f'{path}: marks are allowed only for text nodes.')
    if 'text' in node:
        raise PostContentValidationError(f'{path}: text is allowed only for text nodes.')

    if node_type == 'paragraph':
        _validate_text_align_attrs(attrs, path=f'{path}.attrs')
        _validate_children(node.get('content', []), path=path, depth=depth, counters=counters, allowed_context='inline')
    elif node_type == 'heading':
        _validate_heading_attrs(attrs, path=f'{path}.attrs')
        _validate_children(node.get('content', []), path=path, depth=depth, counters=counters, allowed_context='inline')
    elif node_type == 'blockquote':
        _validate_attrs(attrs, allowed=set(), path=f'{path}.attrs')
        _validate_children(node.get('content', []), path=path, depth=depth, counters=counters, allowed_context='block')
    elif node_type == 'bulletList':
        _validate_attrs(attrs, allowed=set(), path=f'{path}.attrs')
        _validate_children(node.get('content', []), path=path, depth=depth, counters=counters, allowed_context='list')
    elif node_type == 'orderedList':
        _validate_ordered_list_attrs(attrs, path=f'{path}.attrs')
        _validate_children(node.get('content', []), path=path, depth=depth, counters=counters, allowed_context='list')
    elif node_type == 'listItem':
        _validate_attrs(attrs, allowed=set(), path=f'{path}.attrs')
        _validate_children(node.get('content', []), path=path, depth=depth, counters=counters, allowed_context='block')
    elif node_type == 'hardBreak':
        _validate_attrs(attrs, allowed=set(), path=f'{path}.attrs')
        if 'content' in node:
            raise PostContentValidationError(f'{path}: hardBreak cannot have content.')
    elif node_type == 'image':
        _validate_image_attrs(attrs, path=f'{path}.attrs')
        if 'content' in node:
            raise PostContentValidationError(f'{path}: image cannot have content.')


def _validate_children(children, *, path, depth, counters, allowed_context):
    if children is None:
        children = []
    if not isinstance(children, list):
        raise PostContentValidationError(f'{path}.content: content must be a list.')

    for index, child in enumerate(children):
        _validate_post_content_node(
            child,
            path=f'{path}.content[{index}]',
            depth=depth + 1,
            counters=counters,
            allowed_context=allowed_context,
        )


def _validate_attrs(attrs, *, allowed, path):
    unexpected_attrs = set(attrs) - allowed
    if unexpected_attrs:
        raise PostContentValidationError(f'{path}: unexpected attrs: {", ".join(sorted(unexpected_attrs))}.')

    for key, value in attrs.items():
        if value is None:
            continue
        if isinstance(value, str) and len(value) > POST_CONTENT_MAX_ATTR_LENGTH:
            raise PostContentValidationError(f'{path}.{key}: attribute value is too long.')


def _validate_text_align_attrs(attrs, *, path):
    _validate_attrs(attrs, allowed={'textAlign'}, path=path)
    text_align = attrs.get('textAlign')
    if text_align is not None and text_align not in POST_CONTENT_ALLOWED_ALIGNMENTS:
        raise PostContentValidationError(f'{path}.textAlign: unsupported text alignment.')


def _validate_heading_attrs(attrs, *, path):
    _validate_attrs(attrs, allowed={'level', 'textAlign'}, path=path)
    level = attrs.get('level')
    if level not in {1, 2, 3, 4}:
        raise PostContentValidationError(f'{path}.level: heading level must be between 1 and 4.')
    text_align = attrs.get('textAlign')
    if text_align is not None and text_align not in POST_CONTENT_ALLOWED_ALIGNMENTS:
        raise PostContentValidationError(f'{path}.textAlign: unsupported text alignment.')


def _validate_ordered_list_attrs(attrs, *, path):
    _validate_attrs(attrs, allowed={'start'}, path=path)
    start = attrs.get('start')
    if start is not None and (not isinstance(start, int) or start < 1):
        raise PostContentValidationError(f'{path}.start: ordered list start must be a positive integer.')


def _validate_image_attrs(attrs, *, path):
    _validate_attrs(attrs, allowed={'alt', 'height', 'src', 'storageKey', 'title', 'uploadId', 'width'}, path=path)
    src = attrs.get('src')
    if not isinstance(src, str) or not src.strip():
        raise PostContentValidationError(f'{path}.src: image src is required.')
    if src.startswith(('javascript:', 'data:', 'blob:')):
        raise PostContentValidationError(f'{path}.src: unsupported image source.')

    for key in ('alt', 'storageKey', 'title', 'uploadId'):
        value = attrs.get(key)
        if value is not None and not isinstance(value, str):
            raise PostContentValidationError(f'{path}.{key}: attribute must be a string.')

    for key in ('height', 'width'):
        _validate_image_size_attr(attrs.get(key), path=f'{path}.{key}')


def _validate_image_size_attr(value, *, path):
    if value is None:
        return

    if isinstance(value, bool):
        raise PostContentValidationError(f'{path}: image size must be a positive number.')

    if isinstance(value, (int, float)):
        if math.isfinite(value) and 0 < value <= POST_CONTENT_MAX_IMAGE_SIZE_PX:
            return
        raise PostContentValidationError(f'{path}: image size must be a positive number.')

    if isinstance(value, str):
        normalized = value.strip()
        if not normalized:
            return

        unit = ''
        for allowed_unit in POST_CONTENT_ALLOWED_IMAGE_SIZE_UNITS:
            if normalized.endswith(allowed_unit):
                unit = allowed_unit
                numeric_part = normalized[: -len(allowed_unit)]
                break
        else:
            numeric_part = normalized

        try:
            numeric_value = float(numeric_part)
        except ValueError as exc:
            raise PostContentValidationError(f'{path}: image size must be a positive number.') from exc

        if not math.isfinite(numeric_value) or numeric_value <= 0:
            raise PostContentValidationError(f'{path}: image size must be a positive number.')

        if unit == '%' and numeric_value <= 100:
            return
        if unit != '%' and numeric_value <= POST_CONTENT_MAX_IMAGE_SIZE_PX:
            return

    raise PostContentValidationError(f'{path}: image size must be a positive number.')


def _validate_text_node(node, *, path):
    text = node.get('text')
    if not isinstance(text, str):
        raise PostContentValidationError(f'{path}.text: text must be a string.')
    if len(text) > POST_CONTENT_MAX_TEXT_LENGTH:
        raise PostContentValidationError(f'{path}.text: text node is too long.')
    if 'content' in node or 'attrs' in node:
        raise PostContentValidationError(f'{path}: text node cannot have attrs or content.')

    marks = node.get('marks', [])
    if marks is None:
        marks = []
    if not isinstance(marks, list):
        raise PostContentValidationError(f'{path}.marks: marks must be a list.')

    for index, mark in enumerate(marks):
        if not isinstance(mark, dict):
            raise PostContentValidationError(f'{path}.marks[{index}]: mark must be an object.')
        mark_type = mark.get('type')
        if mark_type not in POST_CONTENT_ALLOWED_MARKS:
            raise PostContentValidationError(f'{path}.marks[{index}]: unsupported mark type "{mark_type}".')
        unexpected_keys = set(mark) - {'type', 'attrs'}
        if unexpected_keys:
            raise PostContentValidationError(
                f'{path}.marks[{index}]: unexpected keys: {", ".join(sorted(unexpected_keys))}.'
            )
        attrs = mark.get('attrs') or {}
        if not isinstance(attrs, dict):
            raise PostContentValidationError(f'{path}.marks[{index}].attrs: attrs must be an object.')
        _validate_attrs(attrs, allowed=set(), path=f'{path}.marks[{index}].attrs')


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
