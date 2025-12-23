// src/router/SSRRouter.jsx
// SSR-Compatible Router for BertUI - Works during build AND runtime
import React, { useState, useEffect, createContext, useContext } from 'react';

const RouterContext = createContext(null);

// ✅ SSR-safe useRouter hook
export function useRouter() {
  const context = useContext(RouterContext);
  
  // During SSR, provide a mock router
  if (!context) {
    return {
      pathname: '/',
      params: {},
      navigate: () => {},
      isSSR: true
    };
  }
  
  return context;
}

// ✅ SSR-safe Router component
export function Router({ routes, initialPath = '/' }) {
  const [currentRoute, setCurrentRoute] = useState(null);
  const [params, setParams] = useState({});
  const [isClient, setIsClient] = useState(false);

  // Detect if we're in the browser
  useEffect(() => {
    setIsClient(true);
    matchAndSetRoute(window.location.pathname);

    const handlePopState = () => {
      matchAndSetRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [routes]);

  // Match route on server-side (SSR)
  if (!isClient && !currentRoute) {
    const matched = matchRoute(initialPath, routes);
    if (matched) {
      return React.createElement(
        RouterContext.Provider,
        { value: { pathname: initialPath, params: matched.params, navigate: () => {}, isSSR: true } },
        React.createElement(matched.route.component, { params: matched.params })
      );
    }
  }

  function matchRoute(pathname, routesList) {
    // Try static routes first
    for (const route of routesList) {
      if (route.type === 'static' && route.path === pathname) {
        return { route, params: {} };
      }
    }

    // Try dynamic routes
    for (const route of routesList) {
      if (route.type === 'dynamic') {
        const pattern = route.path.replace(/\[([^\]]+)\]/g, '([^/]+)');
        const regex = new RegExp('^' + pattern + '$');
        const match = pathname.match(regex);

        if (match) {
          const paramNames = [...route.path.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
          const extractedParams = {};
          paramNames.forEach((name, i) => {
            extractedParams[name] = match[i + 1];
          });

          return { route, params: extractedParams };
        }
      }
    }

    return null;
  }

  function matchAndSetRoute(pathname) {
    const matched = matchRoute(pathname, routes);
    
    if (matched) {
      setCurrentRoute(matched.route);
      setParams(matched.params);
    } else {
      setCurrentRoute(null);
      setParams({});
    }
  }

  function navigate(path) {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      matchAndSetRoute(path);
    }
  }

  const routerValue = {
    currentRoute,
    params,
    navigate,
    pathname: typeof window !== 'undefined' ? window.location.pathname : initialPath,
    isSSR: !isClient
  };

  const Component = currentRoute?.component;

  return React.createElement(
    RouterContext.Provider,
    { value: routerValue },
    Component ? React.createElement(Component, { params }) : React.createElement(NotFound, null)
  );
}

// ✅ SSR-safe Link component
export function Link({ to, children, ...props }) {
  const { navigate, isSSR } = useRouter();

  function handleClick(e) {
    // Don't prevent default during SSR
    if (isSSR) return;
    
    e.preventDefault();
    navigate(to);
  }

  return React.createElement('a', { href: to, onClick: handleClick, ...props }, children);
}

function NotFound() {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui'
      }
    },
    React.createElement('h1', { style: { fontSize: '6rem', margin: 0 } }, '404'),
    React.createElement('p', { style: { fontSize: '1.5rem', color: '#666' } }, 'Page not found'),
    React.createElement('a', { 
      href: '/', 
      style: { color: '#10b981', textDecoration: 'none', fontSize: '1.2rem' } 
    }, 'Go home')
  );
}