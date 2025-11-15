# Active Context

## Current Goals

- Key aspects of workflow context for CPOS development include:
- Codebase Context:
- - Open files and editor content: Analyze the code currently open in the editor, including syntax, variable names, function signatures, and overall structure of the surrounding code.
- - File extensions: The file type (e.g., .ts, .js, .py, .prisma) provides immediate context for the programming language and associated conventions.
- - Project structure: Awareness of the project's directory structure (backend/, frontend/, memory-bank/, etc.) and related files helps understand dependencies and potential interactions.
- GitHub Context:
- - Repositories: Knowledge of the GitHub repository (grbac-cpos), including its history, branches, and associated issues and pull requests, provides a broader understanding of the project's goals and ongoing work.
- - Issues and Pull Requests: Leverage information from issues and pull requests to understand specific tasks, bugs, or feature requests that are being addressed.
- Model Context Protocol (MCP) Servers:
- - Default MCP Servers: Access to default MCP servers like Playwright (for browser automation and testing) and GitHub (for repository context).
- - Custom MCP Servers: Extended capabilities through custom MCP servers for external resources or specialized tools relevant to CPOS workflow.
- Agentic Capabilities and Agent Mode:
- - Multi-step workflows: Execute multi-step workflows, make decisions based on context, and adapt approach based on feedback.
- - Dynamic adaptation: In agent mode, combined with MCP, autonomously find relevant information, analyze feedback, and make informed decisions.
- User Input and Conversation:
- - Inline chat and chat sessions: Direct interactions provide explicit context about the user's intent, questions, and desired outcomes.
- - Prompts and instructions: User-phrased prompts and instructions directly influence the context received and processed.
- CRITICAL: Before using any zen-tasks commands, you MUST load the workflow context using zen-tasks_000_workflow_context. This ensures proper dependency-driven development approach for the CPOS project.

## Current Blockers

- None identified; all integration tests are now passing, and builds are successful.
