export type ReferenceImage = {
  url: string;
  caption: string;
  source: string;
  sourceUrl: string;
  license: string;
};

const EXPORT_IMAGES: ReferenceImage[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Korea_International_Trade_Association_Headquarters.jpg/640px-Korea_International_Trade_Association_Headquarters.jpg",
    caption: "한국 무역협회 — 수출 지원·바이어 네트워크 인프라",
    source: "Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Korea_International_Trade_Association_Headquarters.jpg",
    license: "CC BY-SA 4.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Javits_Center_Hudson_Yards_from_Empire_State_Building_2022.jpg/640px-Javits_Center_Hudson_Yards_from_Empire_State_Building_2022.jpg",
    caption: "뉴욕 자비츠 센터 — New York Comic Con 개최 장소",
    source: "Wikimedia Commons (King of Hearts)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Javits_Center_Hudson_Yards_from_Empire_State_Building_2022.jpg",
    license: "CC BY-SA 4.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Containerterminal_Altenwerder.jpg/640px-Containerterminal_Altenwerder.jpg",
    caption: "컨테이너 항만 — 국제 수출 물류·해상 운송",
    source: "Wikimedia Commons (Altenwerder)",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Containerterminal_Altenwerder.jpg",
  },
];

const STARTUP_IMAGES: ReferenceImage[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Seoul_digital_nomad_2023.jpg/640px-Seoul_digital_nomad_2023.jpg",
    caption: "서울 스타트업·디지털 기업 생태계",
    source: "Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Seoul_digital_nomad_2023.jpg",
    license: "CC BY 2.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Korea_SME_and_Startups_Agency_logo.svg/320px-Korea_SME_and_Startups_Agency_logo.svg.png",
    caption: "중소벤처기업부 산하 창업 지원 체계",
    source: "Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Korea_SME_and_Startups_Agency_logo.svg",
    license: "Public domain (government logo)",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Government_complex_sejong.jpg/640px-Government_complex_sejong.jpg",
    caption: "정부 지원사업 행정·공고 관리 인프라 (세종)",
    source: "Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Government_complex_sejong.jpg",
    license: "CC BY-SA 3.0",
  },
];

const RND_IMAGES: ReferenceImage[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Korea_Advanced_Institute_of_Science_and_Technology_%28KAIST%29_main_entrance.jpg/640px-Korea_Advanced_Institute_of_Science_and_Technology_%28KAIST%29_main_entrance.jpg",
    caption: "국내 R&D·기술 혁신 인프라 (KAIST)",
    source: "Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Korea_Advanced_Institute_of_Science_and_Technology_(KAIST)_main_entrance.jpg",
    license: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Ministry_of_Science_and_ICT_%28South_Korea%29_logo_%282013%29.svg/320px-Ministry_of_Science_and_ICT_%28South_Korea%29_logo_%282013%29.svg.png",
    caption: "과학기술정보통신부 — 정부 R&D 정책 주관",
    source: "Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ministry_of_Science_and_ICT_(South_Korea)_logo_(2013).svg",
    license: "Public domain",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Laboratory_research_-_Generic_lab_research_%28aka%29.jpg/640px-Laboratory_research_-_Generic_lab_research_%28aka%29.jpg",
    caption: "연구개발 실험·기술 검증 환경",
    source: "Wikimedia Commons (CDC)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Laboratory_research_-_Generic_lab_research_(aka).jpg",
    license: "Public domain (US CDC)",
  },
];

export const selectReferenceImages = (
  programTitle: string,
  category?: string,
): ReferenceImage[] => {
  const haystack = `${programTitle} ${category ?? ""}`;
  if (/수출|해외|코믹|뉴욕|글로벌|바이어/.test(haystack)) {
    return EXPORT_IMAGES;
  }
  if (/R&D|연구|기술|TIPS|과학/.test(haystack)) {
    return RND_IMAGES;
  }
  return STARTUP_IMAGES;
};
