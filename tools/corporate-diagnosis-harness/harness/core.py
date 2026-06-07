# -*- coding: utf-8 -*-
"""
하네스 코어 (도메인 비의존)
===========================
하네스 엔지니어링의 핵심은 '결정적 스캐폴드'와 '확률적 모델 호출'을 분리하고,
모든 단계 경계에서 출력 계약(contract)을 강제하는 것이다.

- Context : 파이프라인 전체에서 흐르는 상태 + 추적(trace) 버퍼
- Stage   : 단일 처리 노드. kind = DETERMINISTIC | LLM. run() + validate()
- Pipeline: 단계들을 순서대로 실행, 경계 검증, 재시도, 트레이스 기록

설계 원칙
1) 각 단계는 입력 계약을 '전제(require)'하고 출력 계약을 '보장(ensure)'한다.
2) 계약 위반은 조용히 통과하지 않고 StageContractError 로 즉시 중단된다.
3) LLM 단계는 retries 정책을 가지며, 실패 시 날조 대신 명확히 실패한다.
4) 모든 실행은 trace 에 기록되어 사후 감사가 가능하다.
"""
from __future__ import annotations
import time
import traceback
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Optional


class StageKind(Enum):
    DETERMINISTIC = "deterministic"   # 순수 계산/검증/렌더 — 동일 입력 → 동일 출력
    LLM = "llm"                       # 모델 호출 — 비결정적, 재시도/그라운딩 대상


class HarnessError(Exception):
    """하네스 일반 오류."""


class StageContractError(HarnessError):
    """단계의 입력 전제 또는 출력 보장이 깨졌을 때."""


class LLMStageError(HarnessError):
    """LLM 단계가 재시도 후에도 유효한 출력을 내지 못했을 때."""


@dataclass
class TraceEntry:
    stage: str
    kind: str
    ok: bool
    ms: float
    attempts: int = 1
    note: str = ""
    error: Optional[str] = None

    def as_dict(self) -> dict:
        return {
            "stage": self.stage, "kind": self.kind, "ok": self.ok,
            "ms": round(self.ms, 1), "attempts": self.attempts,
            "note": self.note, "error": self.error,
        }


@dataclass
class Context:
    """파이프라인 공유 상태. 단계는 store 에서 읽고 store 에 쓴다."""
    store: dict = field(default_factory=dict)
    trace: list[TraceEntry] = field(default_factory=list)
    config: dict = field(default_factory=dict)

    def get(self, key: str, default: Any = None) -> Any:
        return self.store.get(key, default)

    def put(self, key: str, value: Any) -> None:
        self.store[key] = value

    def require(self, *keys: str) -> None:
        missing = [k for k in keys if k not in self.store]
        if missing:
            raise StageContractError(f"필수 입력 누락: {missing}")

    def trace_dict(self) -> list[dict]:
        return [t.as_dict() for t in self.trace]


class Stage:
    """
    처리 노드 기반 클래스.
    하위 클래스는 run(ctx) 를 구현한다.
    require()/ensure() 로 경계 계약을 선언한다(선택).
    """
    name: str = "stage"
    kind: StageKind = StageKind.DETERMINISTIC
    requires: tuple[str, ...] = ()     # 실행 전 store 에 있어야 하는 키
    produces: tuple[str, ...] = ()     # 실행 후 store 에 있어야 하는 키
    retries: int = 0                   # LLM 단계용 추가 재시도 횟수

    def run(self, ctx: Context) -> None:
        raise NotImplementedError

    # 하위 클래스가 추가 출력 검증을 넣고 싶을 때 오버라이드
    def ensure(self, ctx: Context) -> None:
        pass


class Pipeline:
    def __init__(self, stages: list[Stage], on_log: Optional[Callable[[str], None]] = None):
        self.stages = stages
        self._log = on_log or (lambda m: None)

    def run(self, ctx: Context) -> Context:
        for stage in self.stages:
            self._run_stage(stage, ctx)
        return ctx

    def _run_stage(self, stage: Stage, ctx: Context) -> None:
        # --- 입력 전제 검증 ---
        ctx.require(*stage.requires)

        attempts = 0
        max_attempts = 1 + (stage.retries if stage.kind == StageKind.LLM else 0)
        t0 = time.time()
        last_err: Optional[Exception] = None

        while attempts < max_attempts:
            attempts += 1
            try:
                self._log(f"▶ {stage.name} ({stage.kind.value}) 시도 {attempts}/{max_attempts}")
                stage.run(ctx)
                # --- 출력 보장 검증 ---
                missing = [k for k in stage.produces if k not in ctx.store]
                if missing:
                    raise StageContractError(f"[{stage.name}] 출력 누락: {missing}")
                stage.ensure(ctx)
                ms = (time.time() - t0) * 1000
                ctx.trace.append(TraceEntry(stage.name, stage.kind.value, True, ms, attempts))
                self._log(f"✔ {stage.name} 완료 ({ms:.0f}ms)")
                return
            except StageContractError:
                # 계약 위반은 재시도해도 의미 없음 → 즉시 전파
                ms = (time.time() - t0) * 1000
                ctx.trace.append(TraceEntry(stage.name, stage.kind.value, False, ms,
                                            attempts, error=traceback.format_exc(limit=2)))
                raise
            except Exception as e:  # noqa: BLE001
                last_err = e
                self._log(f"✖ {stage.name} 실패: {e}")
                if attempts >= max_attempts:
                    break

        ms = (time.time() - t0) * 1000
        ctx.trace.append(TraceEntry(stage.name, stage.kind.value, False, ms,
                                    attempts, error=str(last_err)))
        if stage.kind == StageKind.LLM:
            raise LLMStageError(
                f"[{stage.name}] {attempts}회 시도 후 실패 — 날조 대신 중단합니다. 원인: {last_err}"
            )
        raise HarnessError(f"[{stage.name}] 실패: {last_err}")
