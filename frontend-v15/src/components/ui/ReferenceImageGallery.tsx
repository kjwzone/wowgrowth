import type { ReferenceImage } from "@/lib/business-plan-reference-images";

export const ReferenceImageGallery = ({ images }: { images: ReferenceImage[] }) => (
  <section className="rounded-xl border border-outline-variant/40 bg-white p-5 shadow-sm">
    <h3 className="text-base font-semibold text-primary">참고 이미지 (출처 표기)</h3>
    <p className="mt-1 text-xs text-on-surface-variant">
      사실 기반 공개 라이선스 이미지 · 제출 전 공고별 요구 양식을 확인하세요.
    </p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image) => (
        <figure
          key={image.url}
          className="overflow-hidden rounded-lg border border-outline-variant/30"
        >
          <img
            src={image.url}
            alt={image.caption}
            loading="lazy"
            className="h-40 w-full object-cover"
          />
          <figcaption className="space-y-1 p-3 text-xs text-on-surface-variant">
            <p className="font-medium text-primary">{image.caption}</p>
            <p>
              출처:{" "}
              <a
                href={image.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline"
              >
                {image.source}
              </a>
              {" · "}
              {image.license}
            </p>
          </figcaption>
        </figure>
      ))}
    </div>
  </section>
);
