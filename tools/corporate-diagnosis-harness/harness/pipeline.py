# -*- coding: utf-8 -*-
"""
기업경영진단 파이프라인 조립
============================
build_pipeline() 이 단계들을 표준 순서로 묶는다.
LLM 클라이언트를 주입받으므로 실제/Mock 교체가 자유롭다.
"""
from __future__ import annotations
from .core import Pipeline
from .llm import LLMClient
from .stages import (
    IngestStage, ExtractStage, ValidateInputStage,
    CalculateStage, CommentaryStage, RenderStage, QAStage,
)


def build_pipeline(client: LLMClient, *, with_commentary: bool = True,
                   strict_grounding: bool = False, verbose: bool = True) -> Pipeline:
    stages = [
        IngestStage(),
        ExtractStage(client),
        ValidateInputStage(),
        CalculateStage(),
    ]
    if with_commentary:
        stages.append(CommentaryStage(client, strict_grounding=strict_grounding))
    stages += [RenderStage(), QAStage()]

    log = (lambda m: print(m)) if verbose else (lambda m: None)
    return Pipeline(stages, on_log=log)
