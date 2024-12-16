from langchain_openai import ChatOpenAI,OpenAIEmbeddings
from langchain.prompts import PromptTemplate
from langgraph.graph import START, StateGraph,MessagesState,END
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain.tools.retriever import create_retriever_tool
from langgraph.prebuilt import ToolNode,tools_condition
import asyncio
# from IPython.display import Image, display
load_dotenv()

vectorstore = Chroma(collection_name="HorizonEstate",embedding_function=OpenAIEmbeddings(model="text-embedding-3-small"), persist_directory="./chroma_langchain_db")

retriever = vectorstore.as_retriever()
retriever_tool = create_retriever_tool(retriever,name="retrieve_info",description="Retrieve the most relevant info from Horizon  Estate's sales playbook")
tools = [retriever_tool]

def generate(state):
  llm = ChatOpenAI(model="gpt-4o-mini")
  messages = state['messages']
  conv = messages[0].content
  last_message = messages[-1]
  docs = last_message.content
  prompt = PromptTemplate.from_template(
            """As a Horizon Estates representative, provide a brief, relevant response based on:

Property details: {context}
Client conversation: {conv}

Focus on:
- Matching stated client requirements
- Key property features and pricing
- Essential location details

Keep responses concise and professional and always try to give details about the properties that are present in the asked location.
Response:"""
)

  rag_chain = prompt | llm 
  response = rag_chain.invoke({"context":docs, "conv":conv})
  return {"messages":[response]}


def agent(state):
  messages = state['messages']
  conv = messages
  llm = ChatOpenAI(model="gpt-4o-mini")
  llm = llm.bind_tools(tools)
  prompt = PromptTemplate(
      template='''
      You are a meeting assistant for Sales agent working at Horizon Estate and from the given conversation: {conv}
      Your task is to find answers to the question asked to the sales agent by client.
      ''', input_variables=["conv"]
  )
  chain = prompt | llm
  ques = chain.invoke({"conv":conv})
  return {"messages":[ques]}  

builder = StateGraph(MessagesState)
builder.add_node("agent", agent)
retrieve = ToolNode(tools)
builder.add_node("retrieve",retrieve)
builder.add_node("generate",generate)
builder.add_edge(START, "agent")
builder.add_conditional_edges(
    "agent",
    tools_condition,
    {
        "tools":"retrieve",
        END:END,
    },
)
builder.add_edge("retrieve","generate")
builder.add_edge("generate", END)
graph = builder.compile()

# ans=graph.invoke({"messages":HumanMessage(content="Sales Agent: Good afternoon! Welcome to Horizon Estate. How can I assist you today? Client: Hi, Im looking for a residential property in Mumbai")})
# print(ans,"this is ans")

# for m in ans['messages']:
#     m.pretty_print()
# async def test(conv:str):
#   config = {"configurable": {"thread_id": "1"}}
#   input_message = HumanMessage(content=conv)
#   async for event in graph.astream_events({"messages": [input_message]}, config, version="v2"):
#     if event["event"] == "on_chat_model_stream":
#         print(event["data"]["chunk"].content)


