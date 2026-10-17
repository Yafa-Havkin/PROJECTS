"""
Phoenix RAG Bot — Web Crawler
Crawls fnx.co.il, cleans HTML, and splits content into overlapping Chunks.
"""

from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from bs4 import BeautifulSoup, Tag

from backend.config.models import TenantConfig
from backend.models import Chunk, make_chunk_id

logger = logging.getLogger(__name__)

# Chunking constants
MAX_CHUNK = 800
MIN_CHUNK = 300
TARGET_CHUNK = 550
OVERLAP = 150
STEP = TARGET_CHUNK - OVERLAP  # 400

_DROP_TAGS: frozenset[str] = frozenset({"script", "style", "noscript", "iframe"})
_STRUCTURAL_NOISE_TAGS: frozenset[str] = frozenset(
    {"nav", "footer", "header", "aside", "form", "button"}
)
_NOISE_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\bnav\b", r"\bfooter\b", r"\bheader\b", r"\bsidebar\b", r"\bmenu\b",
        r"\bad\b", r"\badvertisement\b", r"\bcookie\b", r"\bpopup\b",
        r"\bmodal\b", r"\bbreadcrumb\b",
    )
)
_HEADING_PREFIX: dict[str, str] = {
    "h1": "# ", "h2": "## ", "h3": "### ",
    "h4": "#### ", "h5": "##### ", "h6": "###### ",
}


class PhoenixCrawler:
    """Crawls the Phoenix Insurance website and converts pages into Chunks."""

    def __init__(self, tenant_config: TenantConfig) -> None:
        self._config = tenant_config
        self._collected_chunks: list[Chunk] = []
        self._enqueued_urls: set[str] = set()
        self._processed_urls: set[str] = set()
        logger.info(
            "PhoenixCrawler initialised — root=%s depth=%d timeout=%dmin",
            tenant_config.crawl_url,
            tenant_config.crawl_max_depth,
            tenant_config.crawl_timeout_minutes,
        )

    async def run(self) -> list[Chunk]:
        """Run the full crawl pipeline and return all discovered Chunks."""
        self._collected_chunks = []
        self._enqueued_urls = {self._config.crawl_url}
        self._processed_urls = set()

        timeout_seconds = self._config.crawl_timeout_minutes * 60
        logger.info(
            "Crawl started — root=%s depth=%d timeout=%ds",
            self._config.crawl_url,
            self._config.crawl_max_depth,
            timeout_seconds,
        )

        try:
            await asyncio.wait_for(self._crawl_internal(), timeout=timeout_seconds)
        except asyncio.TimeoutError:
            uncrawled = sorted(self._enqueued_urls - self._processed_urls)
            logger.warning(
                "Crawl aborted after %d minutes (timeout). %d URL(s) left uncrawled: %s",
                self._config.crawl_timeout_minutes,
                len(uncrawled),
                uncrawled or "(none recorded)",
            )
        except Exception:  # noqa: BLE001
            logger.exception("Crawl failed with an unexpected error; returning partial results")

        logger.info(
            "Crawl finished — %d page(s) processed, %d chunk(s) collected",
            len(self._processed_urls),
            len(self._collected_chunks),
        )
        return self._collected_chunks

    async def _crawl_internal(self) -> None:
        """Drive the crawlee BeautifulSoupCrawler and fill _collected_chunks."""
        from crawlee.crawlers import BeautifulSoupCrawler, BeautifulSoupCrawlingContext

        root_domain = self._registrable_domain(self._config.crawl_url)

        crawler = BeautifulSoupCrawler(
            max_crawl_depth=self._config.crawl_max_depth,
            request_handler_timeout=timedelta(seconds=60),
            max_request_retries=1,
        )

        @crawler.router.default_handler
        async def _handler(context: BeautifulSoupCrawlingContext) -> None:
            final_url = (
                getattr(context.request, "loaded_url", None) or context.request.url
            )
            self._processed_urls.add(context.request.url)

            if "login" in final_url.lower():
                logger.warning("Skipping inaccessible page (login wall): %s", final_url)
                return

            await context.enqueue_links(strategy="same-domain")

            html = str(context.parsed_content)
            clean_text = self.strip_html(html, final_url)
            if not clean_text:
                logger.debug("No extractable text on %s", final_url)
                return

            heading = self._extract_heading(context.parsed_content, final_url)
            page_chunks = self.chunk_text(clean_text, final_url, heading)
            self._collected_chunks.extend(page_chunks)
            logger.info(
                "Processed %s — %d chunk(s) [%s]", final_url, len(page_chunks), root_domain
            )

        @crawler.failed_request_handler
        async def _failed_handler(
            context: BeautifulSoupCrawlingContext, error: Exception
        ) -> None:
            status = self._extract_status_code(context, error)
            self._processed_urls.add(context.request.url)
            if status is not None:
                logger.warning(
                    "HTTP %s while crawling %s — skipping and continuing",
                    status, context.request.url,
                )
            else:
                logger.warning(
                    "Failed to crawl %s (%s) — skipping and continuing",
                    context.request.url, error.__class__.__name__,
                )

        await crawler.run([self._config.crawl_url])

    @staticmethod
    def _extract_heading(soup: BeautifulSoup, url: str) -> str:
        h1 = soup.find("h1")
        if h1 is not None:
            text = h1.get_text(separator=" ", strip=True)
            if text:
                return text
        title = soup.find("title")
        if title is not None:
            text = title.get_text(separator=" ", strip=True)
            if text:
                return text
        return url

    @staticmethod
    def _extract_status_code(context: object, error: Exception) -> int | None:
        response = getattr(context, "http_response", None)
        status = getattr(response, "status_code", None)
        if isinstance(status, int):
            return status
        match = re.search(r"\b([45]\d{2})\b", str(error))
        if match:
            return int(match.group(1))
        return None

    @staticmethod
    def _registrable_domain(url: str) -> str:
        return urlparse(url).netloc

    def strip_html(self, html: str, url: str) -> str:
        """Convert raw HTML into clean, normalised plain text."""
        if not html or not html.strip():
            return ""

        soup = BeautifulSoup(html, "html.parser")

        for tag in soup.find_all(_DROP_TAGS):
            tag.decompose()
        for tag in soup.find_all(_STRUCTURAL_NOISE_TAGS):
            tag.decompose()
        for element in list(soup.find_all(True)):
            if element.parent is None:
                continue
            if self._is_noise_element(element):
                element.decompose()

        lines: list[str] = []
        body = soup.find("body") or soup
        for element in body.descendants:
            if not isinstance(element, Tag):
                continue
            tag_name = element.name.lower() if element.name else ""
            if tag_name in _HEADING_PREFIX:
                heading_text = element.get_text(separator=" ", strip=True)
                if heading_text:
                    lines.append(f"{_HEADING_PREFIX[tag_name]}{heading_text}")
            elif tag_name in {"p", "li", "td", "th", "dt", "dd", "blockquote"}:
                para_text = element.get_text(separator=" ", strip=True)
                if para_text:
                    lines.append(para_text)

        if not lines:
            raw = body.get_text(separator="\n", strip=True)
            lines = [ln for ln in raw.splitlines() if ln.strip()]

        cleaned = "\n".join(lines)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        return cleaned.strip()

    def chunk_text(self, text: str, url: str, heading: str) -> list[Chunk]:
        """Split plain text into overlapping Chunks suitable for embedding."""
        if not text:
            return []

        now = datetime.now(timezone.utc)

        if len(text) <= MAX_CHUNK:
            return [
                Chunk(
                    chunk_id=make_chunk_id(url, 0),
                    url=url,
                    heading=heading,
                    text=text,
                    chunk_index=0,
                    crawled_at=now,
                )
            ]

        chunks: list[Chunk] = []
        chunk_index = 0
        i = 0
        while i < len(text):
            end = min(i + TARGET_CHUNK, len(text))
            boundary = self._find_word_boundary(text, i, end)
            window = text[i:boundary]
            if len(window) >= MIN_CHUNK:
                chunks.append(
                    Chunk(
                        chunk_id=make_chunk_id(url, chunk_index),
                        url=url,
                        heading=heading,
                        text=window,
                        chunk_index=chunk_index,
                        crawled_at=now,
                    )
                )
                chunk_index += 1
            i += STEP
        return chunks

    @staticmethod
    def _find_word_boundary(text: str, start: int, end: int) -> int:
        if end >= len(text):
            return end
        min_boundary = start + MIN_CHUNK
        pos = end
        while pos > min_boundary:
            if text[pos] in (" ", "\n", "\t"):
                return pos
            pos -= 1
        return end

    @staticmethod
    def _is_noise_element(element: Tag) -> bool:
        attrs = getattr(element, "attrs", None)
        if not isinstance(attrs, dict):
            return False
        attrs_to_check: list[str] = []
        classes = attrs.get("class") or []
        if isinstance(classes, list):
            attrs_to_check.extend(classes)
        elif isinstance(classes, str):
            attrs_to_check.append(classes)
        element_id = attrs.get("id") or ""
        if element_id:
            attrs_to_check.append(str(element_id))
        return any(
            pattern.search(attr)
            for attr in attrs_to_check
            for pattern in _NOISE_PATTERNS
        )
