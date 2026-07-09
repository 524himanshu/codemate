import logging
from google import genai
from google.genai import types
from google.genai.errors import APIError
from app.config import settings

logger = logging.getLogger("codemate.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = "gemini-2.5-flash"
        
        if not self.api_key:
            logger.warning(
                "GEMINI_API_KEY is not set. GeminiService will run in mock mode. "
                "Please configure GEMINI_API_KEY in your backend/.env file."
            )
            self.client = None
        else:
            try:
                # Initialize using the modern google-genai SDK
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"Gemini client initialized successfully with model {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
                self.client = None

    def is_mock(self) -> bool:
        return self.client is None

    async def generate_content(self, prompt: str, system_instruction: str = None) -> str:
        """
        Generates content from a text prompt.
        """
        if self.is_mock():
            logger.info("GeminiService is in mock mode. Returning mock response.")
            return f"[MOCK RESPONSE for prompt: '{prompt[:40]}...']"

        try:
            config = types.GenerateContentConfig()
            if system_instruction:
                config.system_instruction = system_instruction
            
            # Using client.models.generate_content
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            return response.text
        except APIError as e:
            logger.error(f"Gemini API Error: {e}")
            raise e
        except Exception as e:
            logger.error(f"Error calling Gemini: {e}")
            raise e

    async def generate_structured_json(self, prompt: str, response_schema: type, system_instruction: str = None):
        """
        Generates structured JSON matching a Pydantic schema using Gemini.
        """
        if self.is_mock():
            logger.info("GeminiService is in mock mode. Returning mock structured data.")
            # We return None or custom mock data in specific mock handlers
            return None

        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
            )
            if system_instruction:
                config.system_instruction = system_instruction

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            return response.text
        except APIError as e:
            logger.error(f"Gemini API Structured Output Error: {e}")
            raise e
        except Exception as e:
            logger.error(f"Error generating structured JSON: {e}")
            raise e

gemini_service = GeminiService()
