// src/router/Router.js - SSR COMPATIBLE VERSION
import { useState, useEffect, createContext, useContext } from 'react';

const RouterContext = createContext(null);

// ✅ FIX: SSR-safe useRouter
export function useRouter() {
  const context = useContext(RouterContext);
  
  // During SSR (when window doesn't exist), return a mock router
  if (typeof window === 'undefined') {
    return {
      pathname: '/',
      params: {},
      navigate: () => {},
      currentRoute: null,
      isSSR: true
    };
  }
  
  if (!context) {
    throw new Error('useRouter must be used within a Router component');
  }
  
  return context;
}

export function Router({ routes }) {
  const [currentRoute, setCurrentRoute] = useState(null);
  const [params, setParams] = useState({});

  useEffect(() => {
    matchAndSetRoute(window.location.pathname);

    const handlePopState = () => {
      matchAndSetRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [routes]);

  function matchAndSetRoute(pathname) {
    // Try static routes first
    for (const route of routes) {
      if (route.type === 'static' && route.path === pathname) {
        setCurrentRoute(route);
        setParams({});
        return;
      }
    }

    // Try dynamic routes
    for (const route of routes) {
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

          setCurrentRoute(route);
          setParams(extractedParams);
          return;
        }
      }
    }

    // No match found
    setCurrentRoute(null);
    setParams({});
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
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    isSSR: typeof window === 'undefined'
  };

  const Component = currentRoute?.component;

  return (
    <RouterContext.Provider value={routerValue}>
      {Component ? <Component params={params} /> : <NotFound />}
    </RouterContext.Provider>
  );
}

// ✅ FIX: SSR-safe Link component
export function Link({ to, children, ...props }) {
  // Try to get router, but don't fail if it doesn't exist
  let router;
  try {
    router = useRouter();
  } catch (e) {
    // During SSR, router might not be available
    router = null;
  }

  function handleClick(e) {
    // During SSR, just use normal link behavior
    if (typeof window === 'undefined') return;
    
    // If no router or navigate function, use normal link
    if (!router || !router.navigate) return;
    
    // Only prevent default if we have client-side routing
    e.preventDefault();
    router.navigate(to);
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: '6rem', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.5rem', color: '#666' }}>Page not found</p>
      <a href="/" style={{ color: '#10b981', textDecoration: 'none', fontSize: '1.2rem' }}>
        Go home
      </a>
    </div>
  );
}