import os
import requests
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class LLMProviderInterface(ABC):
    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str, context: str, temperature: float = 0.7, max_tokens: int = 768) -> str:
        """Generate response given system prompt, user question, and RAG context."""
        pass


class HuggingFaceProvider(LLMProviderInterface):
    def __init__(self, api_key: str = "", model_name: str = "mistralai/Mistral-7B-Instruct-v0.3"):
        self.api_key = api_key or os.getenv("HUGGINGFACE_API_KEY", "")
        self.model_name = model_name

    def generate(self, system_prompt: str, user_prompt: str, context: str, temperature: float = 0.7, max_tokens: int = 768) -> str:
        full_prompt = f"<s>[INST] <<SYS>>\n{system_prompt}\n<</SYS>>\n\nContext Information:\n{context}\n\nUser Question: {user_prompt} [/INST]"
        
        if not self.api_key:
            # Fallback local synthesis if HF API Key is not yet configured
            return self._fallback_synthesis(user_prompt, context)

        url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "inputs": full_prompt,
            "parameters": {
                "temperature": max(0.1, min(temperature, 1.0)),
                "max_new_tokens": max_tokens,
                "return_full_text": False
            }
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0 and "generated_text" in data[0]:
                    return data[0]["generated_text"].strip()
                elif isinstance(data, dict) and "generated_text" in data:
                    return data["generated_text"].strip()
            # If rate limited or loading model on HF serverless
            logger.warning(f"HuggingFace API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"HuggingFace API request failed: {str(e)}")

        return self._fallback_synthesis(user_prompt, context)

    def _fallback_synthesis(self, question: str, context: str) -> str:
        if not context or context == "No relevant institutional documents found.":
            return "Hello! I am the Horizon AI Assistant. Based on our database, I don't see specific records or knowledge base articles answering your exact query. Please feel free to check your student/teacher portal dashboard or contact the admissions office at info@horizondeutsch.com."
        
        return f"### Horizon AI RAG Analysis\n\nBased on your profile and Horizon ERP records:\n\n{context}\n\n*If you need further action or official verification, please use the quick actions below or contact administrative staff.*"


class OpenAIProvider(LLMProviderInterface):
    def __init__(self, api_key: str = "", model_name: str = "gpt-4o-mini"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model_name = model_name

    def generate(self, system_prompt: str, user_prompt: str, context: str, temperature: float = 0.7, max_tokens: int = 768) -> str:
        # Provider abstraction ready for OpenAI SDK
        return HuggingFaceProvider()._fallback_synthesis(user_prompt, context)


class GeminiProvider(LLMProviderInterface):
    def __init__(self, api_key: str = "", model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model_name

    def generate(self, system_prompt: str, user_prompt: str, context: str, temperature: float = 0.7, max_tokens: int = 768) -> str:
        return HuggingFaceProvider()._fallback_synthesis(user_prompt, context)


class LocalOllamaProvider(LLMProviderInterface):
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name

    def generate(self, system_prompt: str, user_prompt: str, context: str, temperature: float = 0.7, max_tokens: int = 768) -> str:
        try:
            res = requests.post("http://localhost:11434/api/generate", json={
                "model": self.model_name,
                "prompt": f"{system_prompt}\nContext:\n{context}\nQuestion:\n{user_prompt}",
                "stream": False
            }, timeout=5)
            if res.status_code == 200:
                return res.json().get("response", "")
        except Exception:
            pass
        return HuggingFaceProvider()._fallback_synthesis(user_prompt, context)


def get_llm_provider(config) -> LLMProviderInterface:
    if config.provider == "OPENAI":
        return OpenAIProvider(api_key=config.openai_api_key, model_name=config.model_name)
    elif config.provider == "GEMINI":
        return GeminiProvider(api_key=config.gemini_api_key, model_name=config.model_name)
    elif config.provider == "OLLAMA":
        return LocalOllamaProvider(model_name=config.model_name)
    return HuggingFaceProvider(api_key=config.huggingface_api_key, model_name=config.model_name)
