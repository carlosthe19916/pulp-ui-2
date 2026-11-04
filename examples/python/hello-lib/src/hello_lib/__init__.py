from rich.text import Text


def greet(name: str) -> Text:
    return Text(f"Hello, {name}!", style="bold green")
