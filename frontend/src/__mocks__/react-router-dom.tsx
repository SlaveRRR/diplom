export const Outlet = () => <div data-testid="outlet-context" />;

export const RouterProvider = () => <div data-testid="router-provider" />;

export const createBrowserRouter = (routes) => routes;

export const useLocation = () => ({
  pathname: '',
  search: '',
});

export const Link = ({ children, onClick, to }) => (
  <a data-testid="link" href={typeof to === 'string' ? to : '#'} onClick={onClick}>
    {children}
  </a>
);

export const useOutletContext = () => ({
  messageApi: {
    error: () => '',
    success: () => '',
  },
});

export const useNavigate = () => () => '';

export const useSearchParams = () => [
  {
    get: () => '',
  },
];

export const useParams = () => {};
