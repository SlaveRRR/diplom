export const Outlet = () => <div data-testid="outlet-context" />;

export const RouterProvider = () => <div data-testid="router-provider" />;

export const createBrowserRouter = (routes) => routes;

export const useLocation = () => ({
  pathname: '',
});

export const Link = () => <div data-testid="link" />;

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
