import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// Custom error types for better error handling
export class AIServiceError extends Error {
  code: string;
  userMessage: string;
  
  constructor(message: string, code: string, userMessage: string) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.userMessage = userMessage;
  }
}

interface EnhanceScopeParams {
  jobTypeName: string;
  baseScope: string[];
  clientName?: string;
  address?: string;
  jobNotes?: string;
}

interface EnhanceScopeResult {
  success: boolean;
  enhancedScope: string[];
  error?: {
    code: string;
    message: string;
  };
}

export async function enhanceScope(params: EnhanceScopeParams): Promise<EnhanceScopeResult> {
  const { jobTypeName, baseScope, clientName, address, jobNotes } = params;

  // Validate inputs
  if (!jobTypeName || typeof jobTypeName !== 'string') {
    return {
      success: false,
      enhancedScope: baseScope,
      error: {
        code: 'INVALID_INPUT',
        message: 'Job type name is required',
      },
    };
  }

  if (!Array.isArray(baseScope) || baseScope.length === 0) {
    return {
      success: false,
      enhancedScope: baseScope,
      error: {
        code: 'INVALID_INPUT',
        message: 'Base scope must be a non-empty array',
      },
    };
  }

  const prompt = `You are a senior estimator at a high-end contracting firm with 25+ years of experience writing winning proposals. Your proposals are known for being thorough, professional, and client-focused while protecting the contractor.

TASK: Transform this scope of work into a premium, bid-winning proposal.

PROJECT DETAILS:
- Job Type: ${jobTypeName}
${clientName ? `- Client: ${clientName}` : ''}
${address ? `- Location: ${address}` : ''}
${jobNotes ? `\nCONTRACTOR'S NOTES FROM SITE VISIT:\n${jobNotes}\n\nUse these notes to personalize and enhance the scope with specific details from the job site.` : ''}

CURRENT SCOPE:
${baseScope.map((item, i) => `${i + 1}. ${item}`).join('\n')}

ENHANCEMENT REQUIREMENTS:

1. PROFESSIONAL LANGUAGE
   - Use industry-standard terminology (e.g., "substrate preparation" not "clean surface")
   - Write in active voice with action verbs
   - Avoid vague words like "quality" or "professional" - be specific

2. TECHNICAL PRECISION
   - Include specific measurements, tolerances, or standards where applicable
   - Reference industry codes/standards when relevant (e.g., TCNA, NEC, IBC)
   - Specify methods and techniques that demonstrate expertise

3. CLIENT PROTECTION
   - Clearly define what IS included to manage expectations
   - Be specific about scope boundaries to prevent scope creep
   - Include verification/inspection steps that build trust

4. CONTRACTOR PROTECTION
   - Include phrases that protect from hidden conditions
   - Specify "per plan" or "as selected by owner" for variable items
   - Include appropriate contingency language

5. COMPLETENESS
   - Ensure logical work sequence (demo → prep → install → finish)
   - Include often-forgotten items (cleanup, protection, disposal)
   - Add value with items clients appreciate (walkthrough, documentation)

FORMAT: Return ONLY a valid JSON array of scope line items. Each item should be 1-2 sentences max. Keep a similar number of items as the original scope (add a few if needed for completeness). No explanations, no markdown - just the raw JSON array.

Example: ["Line item 1.", "Line item 2.", "Line item 3."]`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      let textContent = content.text.trim();
      
      // Remove markdown code blocks if present
      if (textContent.startsWith('```')) {
        textContent = textContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      try {
        const parsed = JSON.parse(textContent);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          return {
            success: true,
            enhancedScope: parsed,
          };
        }
        
        return {
          success: false,
          enhancedScope: baseScope,
          error: {
            code: 'INVALID_RESPONSE_FORMAT',
            message: 'AI returned an invalid format. Please try again.',
          },
        };
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError, "Response:", textContent.substring(0, 200));
        return {
          success: false,
          enhancedScope: baseScope,
          error: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse AI response. Please try again.',
          },
        };
      }
    }
    
    return {
      success: false,
      enhancedScope: baseScope,
      error: {
        code: 'NO_TEXT_CONTENT',
        message: 'AI did not return text content. Please try again.',
      },
    };
  } catch (error: unknown) {
    console.error("Error enhancing scope with AI:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        return {
          success: false,
          enhancedScope: baseScope,
          error: {
            code: 'RATE_LIMITED',
            message: 'AI service is temporarily busy. Please try again in a moment.',
          },
        };
      }
      
      if (error.message.includes('authentication') || error.message.includes('401')) {
        return {
          success: false,
          enhancedScope: baseScope,
          error: {
            code: 'AUTH_ERROR',
            message: 'AI service configuration error. Please contact support.',
          },
        };
      }
      
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return {
          success: false,
          enhancedScope: baseScope,
          error: {
            code: 'TIMEOUT',
            message: 'AI request timed out. Please try again.',
          },
        };
      }
    }
    
    return {
      success: false,
      enhancedScope: baseScope,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    };
  }
}

// Generate smart exclusions based on scope
interface GenerateExclusionsParams {
  jobTypeName: string;
  scope: string[];
  tradeId?: string;
}

interface GenerateExclusionsResult {
  success: boolean;
  exclusions: string[];
  error?: {
    code: string;
    message: string;
  };
}

export async function generateExclusions(params: GenerateExclusionsParams): Promise<GenerateExclusionsResult> {
  const { jobTypeName, scope, tradeId } = params;

  const prompt = `You are an experienced contractor who protects both your business and your clients with clear exclusions.

Given this project scope, generate a list of relevant exclusions that should NOT be included in this proposal.

PROJECT: ${jobTypeName}${tradeId ? ` (${tradeId})` : ''}

SCOPE OF WORK:
${scope.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Generate 4-8 exclusions that:
1. Protect the contractor from hidden conditions
2. Clarify scope boundaries to prevent misunderstandings
3. Are realistic for this type of project
4. Reference related work that might be expected but isn't included

FORMAT: Return ONLY a valid JSON array of exclusion strings. No explanations.

Example: ["Repair of existing water damage", "Permit fees", "Structural modifications"]`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      let textContent = content.text.trim();
      if (textContent.startsWith('```')) {
        textContent = textContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      const parsed = JSON.parse(textContent);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return { success: true, exclusions: parsed };
      }
    }
    
    return {
      success: false,
      exclusions: [],
      error: { code: 'INVALID_RESPONSE', message: 'Failed to generate exclusions' },
    };
  } catch (error) {
    console.error("Error generating exclusions:", error);
    return {
      success: false,
      exclusions: [],
      error: { code: 'AI_ERROR', message: 'Failed to generate exclusions. Please try again.' },
    };
  }
}

export const aiService = {
  enhanceScope,
  generateExclusions,
};
