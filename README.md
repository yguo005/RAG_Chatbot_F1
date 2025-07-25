
---

## ⚡ How It Works

1. **Data Ingestion** (`scripts/loaddb.ts`)
   - Scrapes F1 content from the web.
   - Splits text into chunks with `RecursiveCharacterTextSplitter`.
   - Generates embeddings with OpenAI.
   - Stores chunks and vectors in Astra DB.

2. **Chat Flow** (`app/page.tsx`, `app/api/chat/route.ts`)
   - User asks a question in the chat UI.
   - API receives the full conversation (`messages`).
   - Latest question is embedded and used to search Astra DB for relevant F1 facts.
   - Retrieved facts are injected as context into a system prompt.
   - OpenAI GPT-4 generates a response using both the context and chat history.
   - The answer is streamed back to the UI.

---

## 🛠️ Setup & Development

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/nextjs_f1gpt.git
cd nextjs_f1gpt
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file with your keys:
ASTRA_DB_NAMESPACE=...
ASTRA_DB_COLLECTION=...
ASTRA_DB_API_ENDPOINT=...
ASTRA_DB_APPLICATION_TOKEN=...
OPENAI_API_KEY=...

### 4. Ingest F1 data (run once or as needed)
```bash
npm run seed
```

### 5. Start the development server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

---

## 🧩 Key Technologies

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [OpenAI API](https://platform.openai.com/)
- [Astra DB (DataStax)](https://www.datastax.com/products/datastax-astra-db)
- [LangChain](https://js.langchain.com/)
- [Puppeteer](https://pptr.dev/) (for scraping)

---

## 📚 RAG Architecture

1. **Retrieve**: Find relevant F1 facts using vector search.
2. **Augment**: Inject facts as context into the LLM prompt.
3. **Generate**: LLM answers using both context and chat history.

---

## 🤖 Example Prompt
You are an AI assistant who knows everything about Formula One.
Use the below context to augment what you know about Formula One.
...
START CONTEXT
["Lewis Hamilton is a 7-time champion.", "Max Verstappen won 2023.", ...]
END CONTEXT
QUESTION: Who is the current F1 champion?



