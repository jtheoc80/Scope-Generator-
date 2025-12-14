import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

interface EnhanceScopeParams {
  jobTypeName: string;
  baseScope: string[];
  clientName?: string;
  address?: string;
  jobNotes?: string;
}

export async function enhanceScope(params: EnhanceScopeParams): Promise<string[]> {
  const { jobTypeName, baseScope, clientName, address, jobNotes } = params;

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
      model: "claude-opus-4-5",
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
      const parsed = JSON.parse(content.text);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed;
      }
    }
    
    return baseScope;
  } catch (error: any) {
    console.error("Error enhancing scope with AI:", error);
    return baseScope;
  }
}

export const aiService = {
  enhanceScope,
};
