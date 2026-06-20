export function DataPageLayout({
  description,
  children,
}: {
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-5 pb-24">
      {description ? (
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
