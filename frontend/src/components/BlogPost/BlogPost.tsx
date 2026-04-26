import { Avatar, Button, Card, Empty, Flex, Form, Input, List, Skeleton, Tag, Typography } from 'antd';
import { FC, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { CalendarOutlined, CommentOutlined, SendOutlined } from '@ant-design/icons';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { useApp, useRequireAuthAction } from '@hooks';
import { BlogComment } from '@types';
import { BlogImage } from '@components/BlogCreate/editor/blogImageExtension';
import { OutletContext } from '@pages/LayoutPage/types';

import { useBlogCommentMutation, useBlogPostQuery } from './hooks';

const { TextArea } = Input;
const { Paragraph, Text, Title } = Typography;

type ThreadedComment = BlogComment & { replies: ThreadedComment[] };

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));

const buildCommentTree = (comments: BlogComment[]) => {
  const map = new Map<number, ThreadedComment>();
  comments.forEach((comment) => map.set(comment.id, { ...comment, replies: [] }));

  const roots: ThreadedComment[] = [];
  comments.forEach((comment) => {
    const current = map.get(comment.id);
    if (!current) {
      return;
    }

    if (comment.replyToId) {
      const parent = map.get(comment.replyToId);
      if (parent) {
        parent.replies.push(current);
        return;
      }
    }

    roots.push(current);
  });

  return roots;
};

export const BlogPost: FC = () => {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const { messageApi } = useOutletContext<OutletContext>();
  const { isAuth } = useApp();
  const { redirectToAuth } = useRequireAuthAction();
  const isPreview = searchParams.get('preview') === 'true';
  const { data, isLoading, isError } = useBlogPostQuery(postId, isPreview);
  const commentMutation = useBlogCommentMutation(postId);
  const [commentText, setCommentText] = useState('');
  const [replyToComment, setReplyToComment] = useState<BlogComment | null>(null);

  const editor = useEditor({
    editable: false,
    extensions: [StarterKit, BlogImage],
    content: data?.content ?? { type: 'doc', content: [] },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none rounded-3xl border border-black/6 bg-white px-5 py-5 leading-8 outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && data?.content) {
      editor.commands.setContent(data.content);
    }
  }, [data?.content, editor]);

  const threadedComments = useMemo(() => buildCommentTree(data?.comments ?? []), [data?.comments]);

  const handleSubmitComment = async () => {
    const normalized = commentText.trim();
    if (!normalized) {
      return;
    }

    if (!isAuth) {
      redirectToAuth('comment');
      return;
    }

    try {
      await commentMutation.mutateAsync({ text: normalized, replyToId: replyToComment?.id ?? null });
      setCommentText('');
      setReplyToComment(null);
      messageApi.success(replyToComment ? 'Ответ опубликован.' : 'Комментарий опубликован.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось отправить комментарий.');
    }
  };

  if (isLoading) {
    return (
      <Flex vertical gap={24} className="w-full">
        <Card className="border-0 shadow-sm">
          <Skeleton active avatar paragraph={{ rows: 8 }} />
        </Card>
      </Flex>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-0 shadow-sm">
        <Empty description="Пост не найден или пока недоступен." />
      </Card>
    );
  }

  return (
    <Flex vertical gap={24} className="w-full">
      <section className="overflow-hidden rounded-[32px] border border-black/6 bg-white shadow-[0_20px_60px_rgba(32,20,82,0.06)]">
        <div
          className="h-72 w-full bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(15,15,15,0.18), rgba(15,15,15,0.42)), url(${data.coverUrl || data.cover})`,
          }}
        />
        <Flex vertical gap={20} className="p-6 sm:p-8">
          <Flex gap={8} wrap="wrap">
            {data.tags.map((tag) => (
              <Tag key={tag.id} className="m-0 rounded-full border-0 bg-black/5 px-3 py-1">
                #{tag.name}
              </Tag>
            ))}
          </Flex>

          <Title level={1} className="!mb-0 !text-3xl sm:!text-4xl">
            {data.title}
          </Title>

          <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
            <Flex align="center" gap={12}>
              <Link to={`/profile/${data.author.id}`}>
                <Avatar src={data.author.avatar}>{data.author.username[0]?.toUpperCase()}</Avatar>
              </Link>
              <Flex vertical gap={2}>
                <Link to={`/profile/${data.author.id}`}>
                  <Text strong>@{data.author.username}</Text>
                </Link>
                <Text type="secondary" className="flex items-center gap-1.5">
                  <CalendarOutlined /> {formatDate(data.publishedAt)}
                </Text>
              </Flex>
            </Flex>
            <Tag color="processing" className="m-0 rounded-full px-3 py-1">
              <CommentOutlined /> {data.commentsCount}
            </Tag>
          </Flex>
        </Flex>
      </section>

      <Card className="border-0 shadow-sm">{editor ? <EditorContent editor={editor} /> : null}</Card>

      <Card className="border-0 shadow-sm">
        <Flex vertical gap={16}>
          <Flex vertical gap={4}>
            <Title level={3} className="!mb-0">
              Обсуждение
            </Title>
            <Text type="secondary">
              Комментарии у постов работают через ту же универсальную систему, что и у комиксов.
            </Text>
          </Flex>

          {replyToComment ? (
            <Card className="border border-black/6 bg-black/[0.02] shadow-none">
              <Text type="secondary">Ответ для @{replyToComment.author.username}</Text>
              <Paragraph className="!mb-0">{replyToComment.text}</Paragraph>
              <Button type="link" className="!px-0" onClick={() => setReplyToComment(null)}>
                Отменить
              </Button>
            </Card>
          ) : null}

          <Form layout="vertical" onFinish={handleSubmitComment}>
            <Form.Item label="Добавить комментарий" className="!mb-3">
              <TextArea rows={4} value={commentText} onChange={(event) => setCommentText(event.target.value)} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={commentMutation.isLoading}
              disabled={!commentText.trim()}
            >
              {replyToComment ? 'Отправить ответ' : 'Отправить комментарий'}
            </Button>
          </Form>

          <List
            dataSource={threadedComments}
            locale={{ emptyText: 'Пока комментариев нет. Можно начать обсуждение первым.' }}
            renderItem={(comment) => <BlogCommentItem comment={comment} onReply={setReplyToComment} />}
          />
        </Flex>
      </Card>
    </Flex>
  );
};

type BlogCommentItemProps = {
  comment: ThreadedComment;
  onReply: (comment: BlogComment) => void;
};

const BlogCommentItem: FC<BlogCommentItemProps> = ({ comment, onReply }) => (
  <List.Item className="!px-0">
    <Flex vertical gap={12} className="w-full">
      <Flex gap={12} align="start" className="w-full">
        <Link to={`/profile/${comment.author.id}`}>
          <Avatar src={comment.author.avatar} size={44}>
            {comment.author.username[0]?.toUpperCase()}
          </Avatar>
        </Link>
        <Flex vertical gap={8} className="flex-1">
          <Flex justify="space-between" align="start" gap={12} wrap="wrap">
            <Flex vertical gap={2}>
              <Link to={`/profile/${comment.author.id}`}>
                <Text strong>@{comment.author.username}</Text>
              </Link>
              <Text type="secondary">{formatDate(comment.createdAt)}</Text>
            </Flex>
          </Flex>
          <Text>{comment.text}</Text>
          <Flex>
            <Button type="link" className="!px-0" onClick={() => onReply(comment)}>
              Ответить
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {comment.replies.length ? (
        <div className="ml-14 border-l border-black/8 pl-4">
          <Flex vertical gap={12}>
            {comment.replies.map((reply) => (
              <BlogCommentItem key={reply.id} comment={reply} onReply={onReply} />
            ))}
          </Flex>
        </div>
      ) : null}
    </Flex>
  </List.Item>
);
