from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages

MAX_HISTORY_MESSAGES = 5


class State(TypedDict):
    programme: str
    messages: Annotated[list, add_messages]
    query_type: str
    retrieved_context: str
