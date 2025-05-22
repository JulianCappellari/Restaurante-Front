export default function AccountLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <section className="p-4 max-w-auto mx-auto">
        
        <div className="space-y-4">{children}</div>
      </section>
    );
  }
  