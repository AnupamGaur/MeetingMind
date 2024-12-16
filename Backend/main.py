from fastapi import FastAPI,WebSocket
from typing import Dict
from langchain_core.messages import HumanMessage
from langgraph_sdk import get_client
from graph import graph
app = FastAPI()
active_connections: Dict[int, WebSocket] = {}
connection_counter = 0

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global connection_counter
    await websocket.accept()
    connection_id = connection_counter
    active_connections[connection_id] = websocket
    connection_counter += 1
    
    try:
        while True:
            conv = await websocket.receive_text()
            await run_and_stream(websocket, conv)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        del active_connections[connection_id]

async def run_and_stream(websocket: WebSocket, conv: str):
    config = {"configurable": {"thread_id": "4"}}
    input_message = HumanMessage(content=conv)
    
    async for event in graph.astream_events({"messages": [input_message]}, config, version="v2"):
        if event["event"] == "on_chat_model_stream":
            tk = event["data"]["chunk"].content
            print(tk)
            await websocket.send_text(tk)

