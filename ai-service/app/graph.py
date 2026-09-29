from langgraph.graph import END, START, StateGraph

from .nodes import academic_rag, classifier, fee_rag, general, response, route_query
from .state import State


def build_graph():
    graph = StateGraph(State)
    graph.add_node("classifier", classifier)
    graph.add_node("academic_rag", academic_rag)
    graph.add_node("fee_rag", fee_rag)
    graph.add_node("general", general)
    graph.add_node("response", response)

    graph.add_edge(START, "classifier")
    graph.add_conditional_edges(
        "classifier",
        route_query,
        {"academic": "academic_rag", "fee": "fee_rag", "general": "general"},
    )
    graph.add_edge("academic_rag", "response")
    graph.add_edge("fee_rag", "response")
    graph.add_edge("general", "response")
    graph.add_edge("response", END)
    return graph.compile()


campus_graph = build_graph()
