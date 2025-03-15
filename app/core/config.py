"""
This module loads environment variables and centralizes global settings
for the application. It uses the `dotenv` library to read values from a .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """
    Settings class that holds global configuration such as API keys.
    """
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()
