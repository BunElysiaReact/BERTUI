export function useRouter(): {
    pathname: string;
    params: {};
    navigate: () => void;
    currentRoute: null;
    isSSR: boolean;
};
export function Router({ routes }: {
    routes: any;
}): import("react/jsx-runtime").JSX.Element;
export function Link({ to, children, ...props }: {
    [x: string]: any;
    to: any;
    children: any;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Router.d.ts.map