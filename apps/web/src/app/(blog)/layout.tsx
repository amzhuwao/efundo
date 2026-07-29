import { AdaptiveShell } from '@/components/layout/AdaptiveShell';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdaptiveShell>{children}</AdaptiveShell>;
}
