"""
Phoenix RAG Bot — Offline Crawl & Index CLI.

Crawl the configured tenant website, chunk + embed pages via Gemini, and
persist vectors in ChromaDB.

    python -m backend.crawler.cli --tenant config/phoenix.yaml
    python -m backend.crawler.cli --tenant config/phoenix.yaml --sync

Exit codes: 0 = success (or nothing to embed), 1 = partial (some chunks failed).
"""

from __future__ import annotations

import argparse
import asyncio
import logging

from dotenv import load_dotenv

load_dotenv()

from backend.config.loader import ConfigLoader
from backend.crawler.crawler import PhoenixCrawler
from backend.indexer.embedder import Embedder, IndexingResult
from backend.indexer.vectorstore import ChromaVectorStore

logger = logging.getLogger("phoenix_rag_bot.crawler.cli")

_LOG_LEVELS: tuple[str, ...] = ("DEBUG", "INFO", "WARNING", "ERROR")
_LOG_FORMAT = "%(asctime)s %(levelname)-8s %(name)s | %(message)s"
_LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m backend.crawler.cli",
        description=(
            "Crawl the configured tenant website, chunk and embed the pages, "
            "and persist them to the ChromaDB vector store."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--tenant", required=True, metavar="PATH",
                        help="Path to the TenantConfig YAML (e.g. config/phoenix.yaml).")
    parser.add_argument("--sync", action="store_true", default=False,
                        help="Re-crawl sync: upsert fresh chunks AND delete removed URLs.")
    parser.add_argument("--api-key", default=None, metavar="KEY",
                        help="Gemini API key (else GEMINI_API_KEY env is used).")
    parser.add_argument("--log-level", default="INFO", choices=_LOG_LEVELS,
                        help="Logging verbosity (default: INFO).")
    return parser


def _configure_logging(level_name: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level_name, logging.INFO),
        format=_LOG_FORMAT, datefmt=_LOG_DATEFMT,
    )


def _print_summary(result: IndexingResult, *, sync: bool) -> None:
    mode = "re-crawl sync" if sync else "fresh index"
    print("")
    print("=" * 48)
    print(f"  Phoenix RAG Bot — indexing summary ({mode})")
    print("=" * 48)
    print(f"  Total chunks   : {result.total_chunks}")
    print(f"  Embedded       : {result.embedded_chunks}")
    print(f"  Failed         : {result.failed_chunks}")
    if result.failed_chunk_ids:
        preview = ", ".join(result.failed_chunk_ids[:5])
        suffix = " …" if len(result.failed_chunk_ids) > 5 else ""
        print(f"  Failed IDs     : {preview}{suffix}")
    print("=" * 48)


async def run_pipeline(args: argparse.Namespace) -> int:
    loader = ConfigLoader(args.tenant)
    tenant_config = loader.load_tenant()

    logger.info(
        "Starting crawl pipeline for '%s' — root URL: %s",
        tenant_config.company_name, tenant_config.crawl_url,
    )

    crawler = PhoenixCrawler(tenant_config)
    chunks = await crawler.run()
    logger.info("Crawl produced %d chunk(s).", len(chunks))

    if not chunks:
        logger.warning("No chunks produced; skipping indexing.")
        _print_summary(IndexingResult(0, 0, 0, []), sync=args.sync)
        return 0

    vectorstore = ChromaVectorStore(tenant_config.vectorstore_path)
    embedder = Embedder(tenant_config, vectorstore, api_key=args.api_key)

    if args.sync:
        existing_urls = vectorstore.get_all_urls()
        logger.info("Sync mode: %d URL(s) currently stored.", len(existing_urls))
        result = embedder.sync_vectorstore(chunks, existing_urls)
    else:
        result = embedder.index_chunks(chunks)

    _print_summary(result, sync=args.sync)

    if result.failed_chunks > 0:
        logger.warning(
            "Pipeline finished with %d failed chunk(s); exiting with code 1.",
            result.failed_chunks,
        )
        return 1

    logger.info("Pipeline finished successfully.")
    return 0


def main() -> None:
    args = build_parser().parse_args()
    _configure_logging(args.log_level)
    raise SystemExit(asyncio.run(run_pipeline(args)))


if __name__ == "__main__":
    main()
