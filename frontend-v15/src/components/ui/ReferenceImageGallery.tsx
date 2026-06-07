import type { ReferenceImage } from "@/lib/business-plan-reference-images";

export const ReferenceImageGallery = ({ images }: { images: ReferenceImage[] }) => (
  <section className="rounded-xl border border-outline-variant/40 bg-white p-5 shadow-sm">
    <h3 className="text-base font-semibold text-primary">참고 이미지</h3>
    <p className="mt-1 text-xs text-on-surface-variant">
      BM 구성도 · 시스템 구성도 · MVP 예상도 — 인포그래픽 벡터 SVG (흑백+블루 · 한글 레이블)
    </p>
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      {images.map((image) => (
        <figure
          key={image.caption}
          className="overflow-hidden rounded-lg border border-outline-variant/30 bg-white"
        >
          {image.svg ? (
            <div
              className="flex min-h-[220px] items-center justify-center bg-white p-3 [&>svg]:h-auto [&>svg]:max-h-[240px] [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: image.svg }}
            />
          ) : image.url ? (
            <img
              src={image.url}
              alt={image.caption}
              loading="lazy"
              className="h-52 w-full object-contain bg-white p-2"
            />
          ) : null}
          <figcaption className="space-y-1 border-t border-outline-variant/20 p-3 text-xs text-on-surface-variant">
            <p className="font-medium text-primary">{image.caption}</p>
            <p>
              {image.source}
              {image.license ? ` · ${image.license}` : ""}
            </p>
          </figcaption>
        </figure>
      ))}
    </div>
  </section>
);
