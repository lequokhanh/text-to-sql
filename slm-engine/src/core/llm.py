from llama_index.llms.ollama import Ollama
from llama_index.core.settings import Settings
import json
import logging
import os

logger = logging.getLogger(__name__)


class LLM:
    def __init__(self, model: str, url: str, **kwargs):
        self.model = model or os.getenv("LLM_MODEL")
        self.llm = Ollama(
            model=self.model,
            base_url=url or "http://localhost:11434",
            temperature=kwargs.get("temperature", 0.0),
            request_timeout=300.0,
            additional_kwargs={**kwargs},
        )
        Settings.llm = self.llm
        try:
            logger.info(
                "\n\033[92m[LLM]: \033[0m\n"
                + json.dumps(json.loads(Settings.llm.json()), indent=2)
                + "\n"
            )
        except Exception as e:
            logger.error(f"Failed to initialize LLM model: {e}")

    def chat_completion(self, prompt: str) -> str:
        return self.llm.complete(prompt=prompt)
