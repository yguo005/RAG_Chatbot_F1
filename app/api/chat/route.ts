import OpenAI from "openai";
import {OpenAIStream, StreamingTextResponse} from "ai" //use at frontend to manage mssg and input
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
    ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, 
    ASTRA_DB_API_ENDPOINT, 
    ASTRA_DB_APPLICATION_TOKEN, 
    OPENAI_API_KEY
     

} = process.env

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY

})

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {namespace: ASTRA_DB_NAMESPACE})

export async function POST(req: Request) {
    try {
        const {messages} = await req.json() //extracts messages from the request body sent by your frontend,frontend (using useChat hook) automatically sends the conversation history
        const latestMessage = messages[messages?.length - 1]?.content //messages?.length: Get the length of the array (using optional chaining ?. in case messages is null/undefined)
        //messages?.length - 1:Get the index of the last item b/c in a chat application only generate a response to user's most recent question
        //messages[messages?.length - 1]?.content:Get the content property of that message,  content property is defined in the Message interface/type from the ai package, also the page.tsx


        let docContext = ""

        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: latestMessage,
            encoding_format: "float"
        })

        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null,{
                sort: {
                    $vector: embedding.data[0].embedding
                },
                limit: 10 //get 10 similar items from our database
            })

            const documents = await cursor.toArray()
            const docsMap = documents?.map(doc => doc.text) // doc => doc.text: Takes a document object as input, Returns the value of its text property
            docContext = JSON.stringify(docsMap) //Converts docsMap array to a single string, b/c APIs and web servers expect data in string format, not raw JavaScript objects.
             

        } catch (err){
            console.log("Error quering db...")
            docContext = ""

        } 

        const template = {
            role: "system",
            content: `You are an AI assistant who knows everything about Formula One.
            Use the below context to augment what you know about Formula One.
            The context will provide you with the most recent page data from Wikipedia,
            the official F1 website and other sources.
            If the context doesn't include the information you need answer based on your
            existing knowledge and don't mention the source of your information or 
            what the context does or doesn't include.
            Format responses using markdown where applicable and don't return 
            images.
             
        ------------------------------
        START CONTEXT
        ${docContext}
        END CONTEXT
        ------------------------------
        QUESTION: ${latestMessage}
        -------------------------------`
        }
        
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            stream: true,
            messages: [template, ...messages] //...messages: unpacks all the individual elements from the messages array, rather than treating it as a single array      
        
        })

        const stream = OpenAIStream(response)
        return new StreamingTextResponse(stream)
    } catch (err){
        throw err
    }
}