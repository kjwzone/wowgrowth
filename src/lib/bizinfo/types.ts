/** 기업마당 지원사업정보 API raw item (jsonArray.item) */
export type BizinfoRawItem = {
  pblancId?: string;
  seq?: string;
  pblancNm?: string;
  title?: string;
  author?: string;
  jrsdInsttNm?: string;
  excInsttNm?: string;
  lcategory?: string;
  pldirSportRealmLclasCodeNm?: string;
  bsnsSumryCn?: string;
  description?: string;
  reqstDt?: string;
  reqstBeginEndDe?: string;
  trgetNm?: string;
  hashTags?: string;
  pblancUrl?: string;
  link?: string;
  pubDate?: string;
  creatPnttm?: string;
  inqireCo?: string;
  refrncNm?: string;
  rceptEngnHmpgUrl?: string;
};

export type BizinfoListResponse = {
  jsonArray?: BizinfoRawItem[] | { item?: BizinfoRawItem | BizinfoRawItem[]; totCnt?: number };
};

export type BizinfoProgram = {
  id: string;
  pblancId: string;
  title: string;
  agency: string;
  executingAgency: string;
  category: string;
  region: string;
  supportAmount: string;
  deadline: string;
  daysLeft: number;
  status: "모집중" | "마감임박" | "마감";
  summary: string;
  target: string[];
  applicationPeriod: string;
  externalUrl: string;
  publishedAt: string;
  hashTags: string[];
  source: "bizinfo";
};

export type FetchBizinfoProgramsParams = {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
  region?: string;
};

export type FetchBizinfoProgramsResult = {
  items: BizinfoProgram[];
  page: number;
  pageSize: number;
  total: number;
  source: "bizinfo";
};
