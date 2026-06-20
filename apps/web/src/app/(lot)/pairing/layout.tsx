export default function PairingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col">{children}</div>
  );
}
