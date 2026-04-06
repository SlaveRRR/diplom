import { FC, PropsWithChildren } from 'react';

export const Typography = () => <div data-testid="typography" />;

Typography.Title = () => <div data-testid="title" />;
Typography.Link = () => <div data-testid="link" />;
Typography.Text = () => <div data-testid="text" />;
Typography.Paragraph = () => <div data-testid="paragraph" />;

export const Flex: FC<PropsWithChildren> = ({ children }) => <div>{children}</div>;

export const Button: FC<{ onClick: () => void }> = ({ onClick }) => <button onClick={onClick} data-testid="button" />;

interface FormComponent extends FC<PropsWithChildren<{ onFinish: () => void }>> {
  Item: FC;
}

export const Form: FormComponent = ({ children, onFinish }) => (
  <form onSubmit={onFinish} data-testid="form">
    {children}
  </form>
);

Form.Item = () => <div />;

export const Input = () => <div data-testid="input" />;

Input.Password = () => <div data-testid="input-password" />;

export const message = {
  useMessage: () => [{}, <div data-testid="context-holder" />],
};

export const ConfigProvider: FC<PropsWithChildren> = ({ children }) => <div>{children}</div>;

export const Avatar = ({ children }) => <div data-testid="avatar">{children}</div>;

export const Badge = ({ children }) => <div data-testid="badge">{children}</div>;

export const Drawer = ({ children }) => <div data-testid="drawer">{children}</div>;

export const Image = ({ children }) => <div data-testid="image">{children}</div>;

export const Divider = () => <></>;

export const Menu = ({ children }) => <div data-testid="menu">{children}</div>;

export const Space = ({ children }) => <div data-testid="space">{children}</div>;

export const Tag = () => <div data-testitd="tag" />;

export const Card = () => <div data-testid="card" />;

export const Masonry = () => <div data-testid="masonry" />;

export const Col = ({ children }) => <div data-testid="col">{children}</div>;

export const Row = ({ children }) => <div data-testid="row">{children}</div>;

export const Layout = ({ children }) => <div data-testid="layout">{children}</div>;

Layout.Header = ({ children }) => <div data-testid="layout-header">{children}</div>;

Layout.Content = ({ children }) => <div data-testid="layout-content">{children}</div>;

Layout.Footer = ({ children }) => <div data-testid="layout-footer">{children}</div>;

Layout.Sider = ({ children }) => <div data-testid="layout-sider">{children}</div>;

export const theme = {
  useToken: () => ({
    theme: {},
    token: {},
    hashId: {},
  }),
};
