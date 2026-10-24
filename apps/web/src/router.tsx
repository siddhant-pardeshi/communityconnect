import { useEffect, useState, type ReactNode, type AnchorHTMLAttributes } from 'react';

export interface Route {
  path: string;              // e.g. "/app/decisions/d_123"
  segments: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = window.location.hash.slice(1) || '/';
  const [path, qs = ''] = raw.split('?');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return { path: clean, segments: clean.split('/').filter(Boolean), query: new URLSearchParams(qs) };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function navigate(to: string) {
  window.location.hash = to;
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: ReactNode;
}

export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  );
}
