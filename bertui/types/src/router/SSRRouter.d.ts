export function useRouter(): {
    pathname: string;
    params: {};
    navigate: () => void;
    isSSR: boolean;
};
export function SSRRouter({ routes, initialPath }: {
    routes: any;
    initialPath?: string | undefined;
}): React.DetailedReactHTMLElement<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
export function Link({ to, children, ...props }: {
    [x: string]: any;
    to: any;
    children: any;
}): React.DetailedReactHTMLElement<{
    href: any;
    onClick: (e: any) => void;
}, HTMLElement>;
import React from 'react';
//# sourceMappingURL=SSRRouter.d.ts.map