from operator import itemgetter

from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama


def build_heading_chain(persist_dir: str, collection_name: str, model_name: str):
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    vectordb = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=persist_dir,
    )

    retriever = vectordb.as_retriever(search_kwargs={"k": 6})
    llm = ChatOllama(model=model_name, temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a study coach. Use ONLY the provided context from the syllabus.\n"
         "If the heading/topic is not found, say: "
         "\"I couldn't find that heading in the uploaded syllabus.\"\n\n"
         "Answer format:\n"
         "1) Core concepts (bullets)\n"
         "2) Best study order (step-by-step)\n"
         "3) Study plan for {minutes} minutes\n"
         "4) Key terms/subtopics\n"
         "5) References (include page numbers if available)\n"
        ),
        ("human", "Heading/topic: {heading}\nMinutes: {minutes}\n\nContext:\n{context}")
    ])

    # Takes dict input: {"heading": "...", "minutes": 60}
    chain = (
        {
            "heading": itemgetter("heading"),
            "minutes": itemgetter("minutes"),
            "context": itemgetter("heading") | RunnableLambda(lambda h: retriever.invoke(h)),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain
