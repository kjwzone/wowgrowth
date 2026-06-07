import { isHtmlContent, sanitizeBizinfoHtml } from "@/lib/bizinfo-content";

export const BizinfoHtmlContent = ({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) => {
  if (!html.trim()) return null;

  if (!isHtmlContent(html)) {
    return (
      <p className={`text-sm leading-relaxed text-on-surface-variant ${className}`}>
        {html}
      </p>
    );
  }

  return (
    <div
      className={`bizinfo-html text-sm leading-relaxed text-on-surface-variant [&_p]:mb-2 [&_p:last-child]:mb-0 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeBizinfoHtml(html) }}
    />
  );
};
