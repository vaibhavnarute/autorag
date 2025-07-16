import requests

JINA_API_KEY = "jina_aaaeef221f3647959caf9cccb52214adACNm9b09nlUgBh5NPcxvkNsuY7n9"
JINA_EMBEDDING_URL = "https://api.jina.ai/v1/embeddings"

texts = ["Hello world"]

headers = {
    "Authorization": f"Bearer {JINA_API_KEY}",
    "Content-Type": "application/json",
}
data = {
    "input": texts,
    "model": "jina-embeddings-v2-base-en"
}

response = requests.post(JINA_EMBEDDING_URL, headers=headers, json=data)
response.raise_for_status()
result = response.json()
for item in result["data"]:
    print(item["embedding"])
