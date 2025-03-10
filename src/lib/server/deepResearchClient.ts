import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';

// Define types for our tool responses (matching client-example.ts)
interface ToolResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}

interface InitResponse {
    sessionId: string;
    message: string;
    state: any;
}

interface StepResponse {
    message: string;
    currentDepth: number;
    maxDepth: number;
    lastTopic: string;
    nextTopic: string | null;
    shouldContinue: boolean;
    state: any;
}

/**
 * Run the step-by-step approach for deep research
 * Returns the final report text
 */
export async function runDeepResearch(query: string, depth: number): Promise<string> {
    // Path to the DeepResearchMCP dist/index.js
    const mcpServerPath = path.resolve(process.cwd(), '../DeepResearchMCP/dist/index.js');

    // Connect to the server
    const transport = new StdioClientTransport({
        command: "node",
        args: [mcpServerPath]
    });

    const client = new Client({
        name: "deep-research-client",
        version: "1.0.0"
    }, {
        capabilities: {
            resources: {},
            tools: {},
            prompts: {}
        }
    });

    await client.connect(transport);

    try {
        // Initialize research
        const initResult = await client.callTool({
            name: "initialize-research",
            arguments: {
                query,
                depth
            }
        }) as ToolResponse;

        // Parse the response to get sessionId
        if (!initResult.content || !initResult.content[0] || typeof initResult.content[0].text !== 'string') {
            throw new Error('Invalid response format from initialize-research');
        }

        if (initResult.isError) {
            throw new Error(`Error in initialization: ${initResult.content[0].text}`);
        }

        const initData = JSON.parse(initResult.content[0].text) as InitResponse;
        const { sessionId } = initData;

        // Execute steps until complete
        let currentDepth = 0;

        while (currentDepth < depth) {
            const stepResult = await client.callTool({
                name: "execute-research-step",
                arguments: { sessionId }
            }) as ToolResponse;

            if (!stepResult.content || !stepResult.content[0] || typeof stepResult.content[0].text !== 'string') {
                throw new Error('Invalid response format from execute-research-step');
            }

            if (stepResult.isError) {
                throw new Error(`Error in research step: ${stepResult.content[0].text}`);
            }

            try {
                const stepData = JSON.parse(stepResult.content[0].text) as StepResponse;
                currentDepth = stepData.currentDepth;

                if (!stepData.nextTopic) {
                    break; // No more topics to search
                }
            } catch (parseError) {
                currentDepth++; // Increment depth to continue despite errors
            }
        }

        // Generate final report
        const reportResult = await client.callTool({
            name: "generate-report",
            arguments: { sessionId },
            timeout: 180000 // 3 minutes timeout for report generation
        }) as ToolResponse;

        if (!reportResult.content || !reportResult.content[0] || typeof reportResult.content[0].text !== 'string') {
            throw new Error('Invalid response format from generate-report');
        }

        if (reportResult.isError) {
            throw new Error(`Error generating report: ${reportResult.content[0].text}`);
        }

        return reportResult.content[0].text;

    } finally {
        // Note: The StdioClientTransport doesn't have a disconnect method in the current SDK
        // Following the example's approach of not explicitly cleaning up
    }
} 