import { DataAPIClient } from "@datastax/astra-db-ts"
import {PuppeteerWebBaseLoader} from "langchain/document_loaders/web/puppeteer"
import OpenAI from "openai"

import{RecursiveCharacterTextSplitter} from "langchain/text_splitter"
import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean" 

const {ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, 
    ASTRA_DB_API_ENDPOINT, 
    ASTRA_DB_APPLICATION_TOKEN, 
    OPENAI_API_KEY
} = process.env

const openai = new OpenAI({apiKey: OPENAI_API_KEY})

const f1Data = [
    'https://en.wikipedia.org/wiki/Formula_One#Drivers',
    'https://www.skysports.com/f1/news/12433/13400103/red-bull-what-could-change-after-christian-horner-replaced-by-laurent-mekies-as-team-principal',
    'https://www.formula1.com/en/latest/article/explained-how-formula-1-has-cut-its-carbon-footprint-by-26.4hWrySuBvCXVfGah6hIMRL',
    'https://www.formula1.com/en/latest/article/ive-been-there-and-done-it-coulthard-gives-his-take-on-mclaren-intra-team.4awocvuM8CH76bLM8uVCWs',
    'https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship',
    'https://en.wikipedia.org/wiki/2025_Formula_One_World_Championship',
    'https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship',
    'https://www.formula1.com/en/latest/article/its-race-week-5-storylines-were-excited-about-ahead-of-the-2025-belgian.3Uh6NJTQdg2glmenV3JHWp',
    'https://www.formula1.com/en/latest/article/piastri-vs-norris-hamiltons-start-at-ferrari-and-verstappens-future-f1.7tmZKcB7VrqbCqTBp9Hvi8',
    'https://www.formula1.com/en/latest/article/tech-weekly-ferrari-have-been-testing-a-new-rear-suspension-at-mugello-heres.6FJxU1V38Ea5hRG1WIYlkv',
    'https://www.theguardian.com/sport/2025/jul/10/no-guarantees-for-red-bull-that-horners-sacking-will-keep-verstappen'
   
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT,{namespace: ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createCollection = async(similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension:1536,
            metric: similarityMetric
        }
    })
    console.log(res)
}

const loadSampleData = async() => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await (const url of f1Data) {
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await (const chunk of chunks) {
            // Check if this chunk already exists
            const existing = await collection.findOne({ text: chunk })
            if (existing) {
                console.log("Chunk already exists, skipping insert.")
                continue // Skip to next chunk
            }

            // If not exists, create embedding and insert
            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format: "float"
            })
            const vector = embedding.data[0].embedding

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk
            })
            console.log(res)
        }
    }
}

const scrapePage = async(url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
    },
    gotoOptions: {
        waitUntil: "domcontentloaded"
    },
    evaluate: async (page, browser) => {
        const result = await page.evaluate(() => document.body.innerHTML)
        await browser.close()
        return result
        }
    })

    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
}

createCollection().then(() => loadSampleData())
//loadSampleData()
