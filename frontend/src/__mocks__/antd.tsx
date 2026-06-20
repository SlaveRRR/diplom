import React, { FC, forwardRef, PropsWithChildren } from 'react';

type CommonProps = PropsWithChildren;

const RefDiv = forwardRef<HTMLDivElement, CommonProps>(({ children }, ref) => <div ref={ref}>{children}</div>);
RefDiv.displayName = 'RefDiv';

export const Typography = ({ children }: CommonProps) => <div data-testid="typography">{children}</div>;
Typography.Title = ({ children }: CommonProps) => <div data-testid="title">{children}</div>;
Typography.Link = ({ children }: CommonProps) => <div data-testid="link">{children}</div>;
Typography.Text = ({ children }: CommonProps) => <span data-testid="text">{children}</span>;
Typography.Paragraph = ({ children }: CommonProps) => <div data-testid="paragraph">{children}</div>;

export const Flex: FC<CommonProps> = ({ children }) => <div>{children}</div>;

export const Button: FC<
  PropsWithChildren<{ onClick?: () => void; danger?: boolean; loading?: boolean; icon?: React.ReactNode }>
> = ({ onClick, children, danger, loading, icon }) => (
  <button
    onClick={onClick}
    data-testid="button"
    data-danger={String(Boolean(danger))}
    data-loading={String(Boolean(loading))}
  >
    {icon}
    {children}
  </button>
);

interface FormComponent extends FC<PropsWithChildren<{ onFinish?: () => void }>> {
  Item: FC<PropsWithChildren>;
  useForm: () => [{ setFieldsValue: ReturnType<typeof vi.fn> }];
}

export const Form: FormComponent = ({ children, onFinish }) => (
  <form
    onSubmit={(event) => {
      event.preventDefault();
      onFinish?.();
    }}
    data-testid="form"
  >
    {children}
  </form>
);

Form.Item = ({ children }) => <div>{children}</div>;
Form.useForm = () => [{ setFieldsValue: vi.fn() }];

export const Input = ({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) => <input data-testid="input" value={value} onChange={onChange} placeholder={placeholder} />;
Input.Password = ({ placeholder }: { placeholder?: string }) => (
  <input data-testid="input-password" placeholder={placeholder} />
);
Input.Search = ({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) => <input data-testid="input-search" value={value} onChange={onChange} placeholder={placeholder} />;
Input.TextArea = ({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => <textarea data-testid="input-textarea" value={value} onChange={onChange} />;

export const Alert = ({ children, message, description }) => (
  <div data-testid="alert">
    {message}
    {description}
    {children}
  </div>
);
export const Checkbox = ({ checked, onChange }) => (
  <input data-testid="checkbox" type="checkbox" checked={checked} onChange={onChange} />
);

export const message = {
  useMessage: () => [{}, <div data-testid="context-holder" />],
};

export const notification = {
  useNotification: () => [{}, <></>],
};

export const ConfigProvider: FC<PropsWithChildren> = ({ children }) => <div>{children}</div>;
export const Avatar = ({ children }) => <div data-testid="avatar">{children}</div>;
export const Badge = Object.assign(({ children }) => <div data-testid="badge">{children}</div>, {
  Ribbon: ({ children, text, color }) => (
    <div data-testid="badge-ribbon" data-text={text} data-color={color}>
      {children}
    </div>
  ),
});
export const Drawer = ({ children }) => <div data-testid="drawer">{children}</div>;
export const Modal = ({ children, open, title }) =>
  open ? (
    <div data-testid="modal">
      {title}
      {children}
    </div>
  ) : null;
export const Image = ({ children }) => <div data-testid="image">{children}</div>;
export const Divider = () => <></>;
export const Menu = ({ children }) => <div data-testid="menu">{children}</div>;
export const Space = Object.assign(RefDiv, { Compact: RefDiv });
export const Tag = ({ children }) => <span data-testid="tag">{children}</span>;
export const Card = ({ children, cover }) => (
  <div data-testid="card">
    {cover}
    {children}
  </div>
);
Card.Meta = ({ title, description }) => (
  <div data-testid="card-meta">
    {title}
    {description}
  </div>
);
export const Masonry = () => <div data-testid="masonry" />;
export const Col = RefDiv;
export const Row = RefDiv;
export const Layout = ({ children }) => <div data-testid="layout">{children}</div>;
Layout.Header = ({ children }) => <div data-testid="layout-header">{children}</div>;
Layout.Content = ({ children }) => <div data-testid="layout-content">{children}</div>;
Layout.Footer = ({ children }) => <div data-testid="layout-footer">{children}</div>;
Layout.Sider = ({ children }) => <div data-testid="layout-sider">{children}</div>;

export const theme = {
  useToken: () => ({
    theme: {},
    token: {
      colorBgContainer: '#fff',
      colorBorderSecondary: '#eee',
      borderRadiusLG: 16,
    },
    hashId: {},
  }),
};

export const Empty = Object.assign(
  ({ description, children }: { description?: React.ReactNode; children?: React.ReactNode }) => (
    <div data-testid="empty">
      {description}
      {children}
    </div>
  ),
  { PRESENTED_IMAGE_SIMPLE: 'empty' },
);

export const Skeleton = ({ active, children, paragraph }) => (
  <div data-testid="skeleton" data-active={String(Boolean(active))} data-paragraph={JSON.stringify(paragraph ?? null)}>
    {children}
  </div>
);
Skeleton.Image = ({ children, active }) => (
  <div data-testid="skeleton-image" data-active={String(Boolean(active))}>
    {children}
  </div>
);

export const Statistic = ({ title, value, formatter, prefix, suffix }) => (
  <div data-testid="statistic">
    {title}: {prefix}
    {formatter ? formatter(value) : value}
    {suffix}
  </div>
);

export const Segmented = ({ options }) => (
  <div data-testid="segmented">{options?.map((option) => option.label).join(', ')}</div>
);
export const Carousel = ({ children }) => <div data-testid="carousel">{children}</div>;
export const Tour = () => null;
export const Spin = () => <div data-testid="spin">loading</div>;
export const Tooltip = ({ children, title }) => (
  <div data-testid="tooltip">
    {title}
    {children}
  </div>
);
export const Progress = ({ percent }) => <div data-testid="progress">{percent}</div>;
export const Steps = ({ items = [] }) => (
  <div data-testid="steps">
    {items.map((item) => (
      <div key={item.title}>
        <div>{item.title}</div>
        <div>{item.description}</div>
      </div>
    ))}
  </div>
);

export const List = Object.assign(
  ({ dataSource = [], renderItem, locale }) => (
    <div data-testid="list">{dataSource.length ? dataSource.map((item) => renderItem?.(item)) : locale?.emptyText}</div>
  ),
  {
    Item: ({ children }) => <div data-testid="list-item">{children}</div>,
  },
);

export const Table = () => <div data-testid="table" />;
export const Select = ({ children, placeholder }) => <div data-testid="select">{children ?? placeholder}</div>;
export const Tabs = ({ items = [] }) => (
  <div data-testid="tabs">
    {items.map((item) => (
      <div key={item.key}>
        <div>{item.label}</div>
        <div>{item.children}</div>
      </div>
    ))}
  </div>
);
export const DatePicker = {
  RangePicker: () => <div data-testid="range-picker" />,
};
export const Upload = ({ children }) => <div data-testid="upload">{children}</div>;
Upload.Dragger = ({ children }) => <div data-testid="upload-dragger">{children}</div>;
export const Result = ({ title, subTitle, extra }) => (
  <div data-testid="result">
    {title}
    {subTitle}
    {extra}
  </div>
);
export const Rate = ({ value }) => <div data-testid="rate">{value}</div>;
export const FloatButton = () => <div data-testid="float-button" />;
FloatButton.Group = ({ children }) => <div data-testid="float-button-group">{children}</div>;
export const Grid = {
  useBreakpoint: () => ({}),
};
