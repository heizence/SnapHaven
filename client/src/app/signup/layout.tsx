interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return (
    <div>
      <main>{children}</main>
    </div>
  );
}
