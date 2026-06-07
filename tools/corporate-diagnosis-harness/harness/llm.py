# -*- coding: utf-8 -*-
"""
LLM 클라이언트 추상화
=====================
하네스는 모델 호출을 단일 인터페이스 뒤로 숨긴다. 덕분에
- 실제 호출(AnthropicClient) ↔ 테스트용 가짜(MockClient) 교체가 자유롭고
- 문서(PDF/이미지) 첨부, JSON 강제, 재시도 같은 정책을 한 곳에서 관리한다.

의존성 없음: 표준 라이브러리 urllib 만 사용.
API 키는 환경변수 ANTHROPIC_API_KEY 에서 읽는다(코드/인자에 키를 넣지 않는다).
"""
from __future__ import annotations
import base64
import json
import os
import urllib.request
import urllib.error
from dataclasses import dataclass
from typing import Optional


@dataclass
class Doc:
    """모델에 첨부할 문서/이미지."""
    data_b64: str
    media_type: str  # application/pdf, image/png, image/jpeg ...

    @classmethod
    def from_path(cls, path: str) -> "Doc":
        ext = path.lower().rsplit(".", 1)[-1]
        mt = {
            "pdf": "application/pdf", "png": "image/png",
            "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp",
        }.get(ext)
        if mt is None:
            raise ValueError(f"지원하지 않는 첨부 형식: .{ext}")
        with open(path, "rb") as f:
            return cls(base64.standard_b64encode(f.read()).decode(), mt)


class LLMClient:
    """인터페이스. complete(system, user, docs) -> str(text)."""
    def complete(self, system: str, user: str, docs: Optional[list[Doc]] = None) -> str:
        raise NotImplementedError


class AnthropicClient(LLMClient):
    ENDPOINT = "https://api.anthropic.com/v1/messages"

    def __init__(self, model: str = "claude-opus-4-8", max_tokens: int = 8000,
                 api_key: Optional[str] = None, timeout: int = 120):
        self.model = model
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY 환경변수가 없습니다. "
                "실제 호출 없이 시험하려면 MockClient 를 쓰거나 run.py --mock 을 사용하세요."
            )

    def complete(self, system: str, user: str, docs: Optional[list[Doc]] = None) -> str:
        content: list[dict] = []
        for d in (docs or []):
            block_type = "document" if d.media_type == "application/pdf" else "image"
            content.append({
                "type": block_type,
                "source": {"type": "base64", "media_type": d.media_type, "data": d.data_b64},
            })
        content.append({"type": "text", "text": user})

        payload = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": content}],
        }
        req = urllib.request.Request(
            self.ENDPOINT,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "content-type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"Anthropic API 오류 {e.code}: {e.read().decode('utf-8', 'ignore')[:400]}")
        # 텍스트 블록만 결합
        return "".join(b.get("text", "") for b in body.get("content", []) if b.get("type") == "text")


class MockClient(LLMClient):
    """
    키 없이 하네스 배선을 검증하기 위한 가짜 클라이언트.
    호출 라우팅 규칙(routes): (키워드, 반환문자열-or-콜러블) 목록.
    user 프롬프트에 키워드가 포함되면 해당 응답을 반환한다.
    """
    def __init__(self, routes: Optional[list[tuple[str, object]]] = None):
        self.routes = routes or []
        self.calls: list[dict] = []

    def complete(self, system: str, user: str, docs: Optional[list[Doc]] = None) -> str:
        self.calls.append({"system": system[:80], "user": user[:120], "n_docs": len(docs or [])})
        for keyword, response in self.routes:
            if keyword in user or keyword in system:
                return response(user) if callable(response) else response
        raise RuntimeError(f"MockClient: 매칭되는 라우트 없음 (프롬프트 앞부분: {user[:60]!r})")
