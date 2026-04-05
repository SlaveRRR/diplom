import { Card, Flex, Input, Space, Typography } from 'antd';

import { usePlatformTaxonomy } from '@hooks';
import { useComicCreateStore } from '@components/ComicCreate/hooks';
import { Select } from '@components/shared';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const FirstStep = () => {
  const { data, isLoading } = usePlatformTaxonomy();
  const { title, description, tagIds, genreId, setGenreId, setTitle, setDescription, setTagIds } =
    useComicCreateStore();

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <Space orientation="vertical" size={20} className="w-full">
        <Flex vertical gap={4}>
          <Title level={3} className="mb-2!">
            Базовая информация
          </Title>
          <Text type="secondary">
            С этого шага начинается карточка комикса: сильное название, понятное описание и верные теги.
          </Text>
        </Flex>
        <Space orientation="vertical" size={16} className="w-full">
          <div>
            <Text strong>Название</Text>
            <Input
              size="large"
              className="mt-2"
              placeholder="Например, Лунная башня"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div>
            <Text strong>Описание</Text>
            <TextArea
              rows={6}
              className="mt-2"
              placeholder="Коротко опиши завязку, мир и настроение истории."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div>
            <Text strong>Теги</Text>
            <Select
              mode="multiple"
              size="middle"
              className="mt-2 w-full"
              placeholder="Теги"
              options={data?.tags}
              value={tagIds}
              onChange={setTagIds}
              isLoading={isLoading}
              isUseOptionsRender
            />
          </div>

          <div>
            <Text strong>Жанр</Text>
            <Select
              size="middle"
              className="mt-2 w-full"
              placeholder="Жанр"
              options={data?.genres}
              value={genreId}
              onChange={setGenreId}
              isLoading={isLoading}
              isUseOptionsRender
            />
          </div>
        </Space>
      </Space>
    </Card>
  );
};
