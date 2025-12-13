from pathlib import Path


class Config:
    CLAUDE_DIR = Path.home() / ".claude"
    PROJECTS_DIR = CLAUDE_DIR / "projects"
    WATCH_INTERVAL = 0.2  # seconds


config = Config()
