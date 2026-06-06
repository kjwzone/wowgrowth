export type DaumPostcodeData = {
  roadAddress: string;
  jibunAddress: string;
  sido: string;
  sigungu: string;
  bname: string;
  buildingName: string;
  apartment: string;
  zonecode: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        onclose?: (state: string) => void;
        width?: string | number;
        height?: string | number;
      }) => {
        open: () => void;
        embed: (element: HTMLElement) => void;
      };
    };
  }
}

export {};
