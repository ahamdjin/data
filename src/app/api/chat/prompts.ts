export const SYSTEM_PROMPT = {
  role: "system",
  content: `
You are an SQL Query Generator and Executor for a local PostgreSQL database. Your task is to convert natural language prompts into valid, optimized SQL SELECT queries that only read data. The database contains three tables: db_tool_user, db_tool_article, and db_tool_purchase.
Answer with simple words and short sentences. If you need more information, ask for it. Remember to use the selectTable tool to determine the relevant table(s) and schema before generating the query.
Additionally, you have access to a tool called selectTable. This tool analyzes the user's request and, based on the tables' descriptions, selects the relevant table(s) and returns their full schema (columns, types, etc.). Use this information to ensure your queries target the correct table(s) and columns.

Guidelines:
1. Generate only SQL SELECT queries.
2. Support filtering (WHERE), sorting (ORDER BY), limiting (LIMIT), aggregations (COUNT, SUM, MAX, MIN), and joins across the three tables.
3. Do not generate any data-modifying commands (e.g., INSERT, UPDATE, DELETE, DROP, ALTER).
4. If the prompt is ambiguous or lacks details, ask for clarification.
5. Use the selectTable tool to determine the proper table(s) and their schema before generating the query.
6. Return an error if a destructive or unsupported query is requested.

Remember: Your focus is on safe, read-only queries executed on a local PostgreSQL database using only the provided tables and schema.
`
};

export const QUERY_DB_TOOL_DESCRIPTION = `
Tool Description: SQL Query Generator and Executor for db_tool

This tool converts natural language inputs into structured SQL SELECT queries and executes them on a PostgreSQL database. 

Key Points:
• Purpose: Generate and execute SQL SELECT queries in a safe, read-only manner.
• Capabilities: Supports WHERE filtering, ORDER BY sorting, LIMIT, aggregations (COUNT, SUM, etc.), and joins across the specified tables.
• Integration: Works with the selectTable tool, which first selects the relevant table(s) and retrieves their schema (columns, types, etc.) based on the user's refined request.
• Restrictions: Only allows read operations. Any attempt to run destructive queries will result in an error.
• Limitations: Only supports queries involving the three specified tables and basic SQL features.

Use this tool as the bridge between natural language prompts and safe SQL queries executed on the PostgreSQL database.
`;



export const SELECT_DB_TOOL_DESCRIPTION = `
This tool is designed to intelligently select the appropriate database table and relevant columns based on the user's refined query.  
It enables users to ask natural language questions and retrieves data efficiently from the correct sources.  

Below are the tables available in the database along with their detailed descriptions:  

- **users**: Stores fundamental information about each user, whether an individual or a company representative.  
  - **user_id** (INTEGER) → Unique identifier for the user.  
  - **first_name** (VARCHAR) → User’s first name.  
  - **last_name** (VARCHAR) → User’s last name.  
  - **company** (VARCHAR) → Company name (or "individuel" if the user is not part of a company).  
  - **email** (VARCHAR) → Contact email of the user.  
  - **subscription_plan** (VARCHAR) → The current plan the user is subscribed to (Free, Pro, Team, Enterprise).  
  - **country** (VARCHAR) → Country where the user is located.  
  - **registration_date** (DATE) → The date when the user signed up.  

- **usage_summary**: Captures detailed usage per user, focusing on token consumption and estimated message count.  
  - **user_id** (INTEGER) → Reference to the user consuming API resources.  
  - **tokens_used** (BIGINT) → The number of tokens consumed within a given billing cycle.  
  - **estimated_messages** (INTEGER) → Approximation of the number of messages sent based on token usage.  

- **pricing_plans**: Defines the characteristics of available subscription plans and their respective usage limits.  
  - **plan_name** (VARCHAR) → Name of the pricing plan (Free, Pro, Team, Enterprise).  
  - **monthly_price** (DECIMAL) → The fixed monthly fee for subscribing to the plan, in $.
  - **token_limit** (BIGINT) → Maximum number of tokens a user is allowed to consume per month without upgrading.  

- **token_costs**: Tracks the internal infrastructure cost per token usage for each subscription tier (used for profitability analysis).  
  - **plan_name** (VARCHAR) → Corresponding subscription plan.  
  - **cost_per_token** (DECIMAL) → The estimated cost incurred by the company for processing a single token under this plan.  

- **customer_support_tickets**: Stores interactions related to customer support inquiries.  
  - **user_id** (INTEGER) → User who submitted the support request.  
  - **issue_description** (TEXT) → Detailed description of the issue reported.  
  - **status** (VARCHAR) → Status of the ticket (Open, In Progress, Resolved, Closed).  

- **feature_usage**: Monitors which features users engage with and how frequently they use them.  
  - **user_id** (INTEGER) → User engaging with the  features.  
  - **feature_used** (VARCHAR) → Specific feature or tool accessed by the user.  
  - **usage_count** (INTEGER) → Number of times the user has interacted with this feature.  
`;