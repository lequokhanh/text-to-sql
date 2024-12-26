from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.settings import Settings
import os
import json
import logging

logger = logging.getLogger(__name__)


class Embedding:
    def __init__(self, model: str, max_length: int = 256):
        self.model = model or os.getenv("EMBEDDING_MODEL")
        self.embed_model = HuggingFaceEmbedding(
            model_name=self.model,
            max_length=max_length,
            embed_batch_size=32,
            cache_folder="../huggingface_cache",
        )
        Settings.embed_model = self.embed_model
        # Test model connection
        try:
            logger.info(
                "\n\033[92m[EMBEDDING]: \033[0m\n"
                + json.dumps(json.loads(Settings.embed_model.json()), indent=2)
                + "\n"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Embedding model: {e}")

    def get_text_embedding(self, text=None):
        """Get embedding from text."""
        if not Settings.embed_model:
            raise ValueError("Embedding model not initialized.")
        return Settings.embed_model.get_text_embedding_batch([text])
