let loadPromise: Promise<void> | null = null;

export const loadDaumPostcodeScript = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.daum?.Postcode) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
    };
    document.body.appendChild(script);
  });

  return loadPromise;
};

export const openDaumPostcodeSearch = async (
  onComplete: (data: import("@/types/daum-postcode").DaumPostcodeData) => void,
): Promise<void> => {
  await loadDaumPostcodeScript();

  if (!window.daum?.Postcode) {
    throw new Error("주소 검색을 사용할 수 없습니다.");
  }

  new window.daum.Postcode({
    oncomplete: onComplete,
  }).open();
};
