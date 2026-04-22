'use client';

import { useEffect } from 'react';
import { track } from '@/lib/visitor';

/**
 * Silent tracker — drop this anywhere in a page to register a page_view event
 * on the current visitor's timeline. Extra data (e.g. product slug) can be
 * passed via the `data` prop and merges into the profile.
 */
export function PageView({ data = {} }: { data?: Record<string, unknown> }) {
  useEffect(() => {
    track('page_view', data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function ProductView({
  slug,
  marca,
  categoria,
}: {
  slug: string;
  marca?: string;
  categoria?: string;
}) {
  useEffect(() => {
    track('product_view', { slug, marca, categoria });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  return null;
}
