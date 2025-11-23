import { Agent, ZeeWorkflow, createTool } from "@covalenthq/ai-agent-sdk";
import { user } from "@covalenthq/ai-agent-sdk/dist/core/base";
import { StateFn } from "@covalenthq/ai-agent-sdk/dist/core/state";
import "dotenv/config";
import { z } from "zod";

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// Type definitions
interface FetchNewsArgs {
    topic: string;
    limit: number;
}

interface Article {
    title: string;
    content: string;
    source?: string;
    date?: string;
}

// Environment variables with defaults
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
const PORT = process.env.PORT || 3400;

const fetchNews = createTool({
    id: "fetch-news",
    description: "Fetch the latest academic papers and articles about Zero Knowledge Proofs, cryptography, and Web3 topics",
    schema: z.object({
        topic: z.string().describe("The topic to search for"),
        limit: z.number().min(1).max(10).describe("Number of articles to fetch (1-10)"),
    }),
    execute: async (args) => {
        const { topic, limit } = args as FetchNewsArgs;

        // Enhanced mock data with ZK/Web3 focus
        // In production, this would fetch from arXiv, ePrint, or other academic sources
        const articles: Article[] = [
            {
                title: "zkSNARKs: Succinct Non-Interactive Zero Knowledge Arguments",
                content: "Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zkSNARKs) represent a breakthrough in cryptographic protocols. These systems allow one party to prove possession of certain information without revealing that information. Applications include blockchain privacy, verifiable computation, and secure voting systems. Recent optimizations have reduced proof generation time and verification costs significantly.",
                source: "Cryptology ePrint Archive",
                date: "2024"
            },
            {
                title: "Scaling Ethereum with Zero-Knowledge Rollups",
                content: "ZK-Rollups emerge as a leading Layer 2 scaling solution for Ethereum. By bundling hundreds of transfers into a single transaction and generating a cryptographic proof, ZK-Rollups achieve higher throughput while maintaining security. Projects like zkSync, StarkNet, and Polygon zkEVM demonstrate practical implementations with significant gas savings and improved user experience.",
                source: "Ethereum Research",
                date: "2024"
            },
            {
                title: "Privacy-Preserving Smart Contracts using Zero-Knowledge Proofs",
                content: "Integration of zero-knowledge proofs into smart contracts enables confidential transactions while maintaining verifiability. This advancement allows businesses to leverage blockchain's transparency benefits without exposing sensitive data. Use cases include private DeFi, confidential voting, and compliant identity verification systems.",
                source: "ACM Conference",
                date: "2024"
            },
            {
                title: "PLONK: Permutations over Lagrange-bases for Oecumenical Noninteractive arguments of Knowledge",
                content: "PLONK introduces a universal and updatable structured reference string, significantly improving upon previous zkSNARK constructions. Its flexibility allows for more efficient circuit design and reduces the trusted setup requirements. This protocol has become foundational for modern ZK systems.",
                source: "Cryptology ePrint Archive",
                date: "2024"
            },
            {
                title: "Zero-Knowledge Machine Learning: Privacy-Preserving AI",
                content: "Combining zero-knowledge proofs with machine learning enables verification of AI model predictions without revealing the model or input data. This breakthrough has implications for medical diagnosis, financial modeling, and other privacy-sensitive AI applications. Recent work demonstrates practical proof generation for neural network inference.",
                source: "AI & Security Journal",
                date: "2024"
            },
        ];

        return JSON.stringify(articles.slice(0, limit));
    },
});

const researchAgent = new Agent({
    name: "Research Agent",
    model: {
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    },
    description: "An expert AI researcher specializing in zero-knowledge cryptography, Web3 protocols, and blockchain technology.",
    instructions: [
        "Use the fetch-news tool to retrieve academic papers and articles about the requested topic",
        "Focus on zero-knowledge proofs (zkSNARKs, zkSTARKs, PLONK), Layer 2 scaling solutions, and privacy-preserving technologies",
        "Analyze the technical content, methodology, and practical applications described in the papers",
        "Identify key innovations, breakthrough concepts, and real-world implementations",
        "Compare and contrast different approaches and their trade-offs",
        "Highlight the relevance to Ethereum and Web3 ecosystem development",
        "Extract specific technical details such as performance metrics, security guarantees, and computational complexity",
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
    description: "An expert technical writer that creates comprehensive yet accessible summaries of zero-knowledge cryptography research.",
    instructions: [
        "Review the research analysis provided by the Research Agent",
        "Create a well-structured summary that balances technical depth with accessibility",
        "Start with a brief overview of the main topic",
        "Organize findings into clear sections: Key Concepts, Technical Innovations, Practical Applications, and Future Implications",
        "Use bullet points for key takeaways and important technical details",
        "Explain complex cryptographic concepts in a way that's understandable to developers and researchers",
        "Include specific examples and use cases where applicable",
        "Conclude with potential impact on the Web3 ecosystem",
        "Maintain technical accuracy while ensuring the summary is engaging and informative",
    ],
});

const zee = new ZeeWorkflow({
    description: "Collaborative AI study group analyzing Zero Knowledge Proof research, cryptographic protocols, and Web3 innovations",
    output: "Comprehensive technical analysis and insights from academic papers on ZK cryptography and blockchain technology",
    agents: { researchAgent, summaryAgent },
});

// Request validation schema
const analyzeRequestSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters").max(200, "Topic must be less than 200 characters"),
});

// Initialize Express app
const app = express();

// CORS configuration - restrict origins in production
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['POST', 'GET'],
    credentials: true,
}));

app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main analysis endpoint with improved error handling and validation
app.post('/api/analyze', async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        const validationResult = analyzeRequestSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                error: 'Invalid request',
                details: validationResult.error.errors.map(e => e.message).join(', ')
            });
            return;
        }

        const { topic } = validationResult.data;

        console.log(`[${new Date().toISOString()}] Analyzing topic: ${topic}`);

        // Initialize workflow state
        const initialState = StateFn.root(zee.description);
        initialState.messages.push(
            user(`Analyze the latest research and academic papers about ${topic} in the context of zero-knowledge cryptography and Web3 technology`)
        );

        // Run the workflow with timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 60000); // 60 second timeout
        });

        const workflowPromise = ZeeWorkflow.run(zee, initialState);
        const result = await Promise.race([workflowPromise, timeoutPromise]) as Awaited<typeof workflowPromise>;

        const summary = result.messages[result.messages.length - 1].content;

        console.log(`[${new Date().toISOString()}] Analysis completed successfully`);

        res.json({
            success: true,
            summary,
            topic,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error:`, error);

        if (error instanceof Error) {
            if (error.message === 'Request timeout') {
                res.status(504).json({
                    error: 'Request timeout',
                    message: 'The analysis took too long to complete. Please try again.'
                });
                return;
            }

            res.status(500).json({
                error: 'Analysis failed',
                message: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred'
        });
    }
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ZK Study Group API Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
