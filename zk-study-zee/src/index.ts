import { Agent, ZeeWorkflow, createTool } from "@covalenthq/ai-agent-sdk";
import { user } from "@covalenthq/ai-agent-sdk/dist/core/base";
import { StateFn } from "@covalenthq/ai-agent-sdk/dist/core/state";
import "dotenv/config";
import { z } from "zod";

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const fetchNews = createTool({
    id: "fetch-news",
    description: "Fetch the latest news articles about a given topic",
    schema: z.object({
        topic: z.string().describe("The topic to search for"),
        limit: z.number().describe("Number of articles to fetch"),
    }),
    execute: async (args) => {
        const articles = [
            {
                title: "AI Advances in 2024",
                content:
                    "Recent developments in artificial intelligence show promising results in various fields...",
            },
            {
                title: "The Future of Technology",
                content:
                    "Emerging technologies are reshaping how we live and work...",
            },
            {
                title: "Innovation in Tech Industry",
                content:
                    "Leading companies are pushing boundaries in technological innovation...",
            },
        ];
        const limit = (args as any).limit || 3;
        return JSON.stringify(articles.slice(0, limit));
    },
});

const researchAgent = new Agent({
    name: "Research Agent",
    model: {
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    },
    description: "An AI researcher that fetches and analyzes news articles.",
    instructions: [
        "Use the fetch-news tool to get articles about the requested topic",
        "Analyze the content of the articles",
        "Identify key trends and insights",
    ],
    tools: {
        fetchNews,
    },
});

const summaryAgent = new Agent({
    name: "Summary Agent",
    model: {
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    },
    description:
        "An AI writer that creates concise summaries from research analysis.",
    instructions: [
        "Review the research analysis provided",
        "Create a clear and concise summary",
        "Highlight the most important points",
        "Use bullet points for key takeaways",
    ],
});

const zee = new ZeeWorkflow({
    description: "Discuss about Zero Knowledge Proof academic papers to generate Insight",
    output: "A discussion based on papers and key insights",
    agents: { researchAgent, summaryAgent },
});

// (async function discuss() {
//     const initialState = StateFn.root(zee.description);
//     initialState.messages.push(
//         user(
//             "Analyze the latest papers about Zero Knowledge Proofs for Large Language Models"
//         )
//     );

//     const result = await ZeeWorkflow.run(zee, initialState);
//     console.log("\nFinal Summary:");
//     console.log(result.messages[result.messages.length - 1].content);
// })();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/analyze', async (req, res) => {
    const { topic } = req.body;
    const initialState = StateFn.root(zee.description);
    initialState.messages.push(user(`Analyze the latest papers about ${topic}`));

    try {
        const result = await ZeeWorkflow.run(zee, initialState);
        res.json({ summary: result.messages[result.messages.length - 1].content });
    } catch (error) {
        res.status(500).json({ error: (error as any).message });
    }
});

const PORT = process.env.PORT || 3400;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});