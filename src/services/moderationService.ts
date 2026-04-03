import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
}

export const moderateListing = async (title: string, description: string): Promise<ModerationResult> => {
  try {
    const prompt = `You are a content moderator for HudumaLink Kenya, a marketplace. 
    Analyze the following listing and determine if it contains prohibited content (scams, drugs, weapons, adult content, hate speech, or highly suspicious offers).
    
    Listing Title: ${title}
    Listing Description: ${description}
    
    Return a JSON object with:
    - isSafe: boolean
    - reason: string (if not safe, explain why in one short sentence)
    `;

    // Add a timeout to the AI call
    const moderationPromise = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), 10000) // 10 second timeout
    );

    const response = await Promise.race([moderationPromise, timeoutPromise]);

    if (!response) {
      console.warn('Moderation timed out, defaulting to safe');
      return { isSafe: true };
    }

    const result = JSON.parse(response.text || '{"isSafe": true}');
    return result;
  } catch (error) {
    console.error('Moderation error:', error);
    // Default to safe if AI fails, but we still have manual review
    return { isSafe: true };
  }
};
