export const PageCard = ({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${className}`}
  >
    <h2 className="text-lg font-medium">{title}</h2>
    {description ? (
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    ) : null}
    {children ? <div className="mt-4">{children}</div> : null}
  </section>
);
