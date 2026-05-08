'use server';
/**
 * @fileOverview This file implements a Genkit flow that analyzes historical sales data
 * and current inventory levels to generate proactive operational insights.
 *
 * - generateProactiveOperationalInsights - A function that handles the generation of insights.
 * - ProactiveOperationalInsightsInput - The input type for the function.
 * - ProactiveOperationalInsightsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProactiveOperationalInsightsInputSchema = z.object({
  historicalSalesSummary: z.string().describe(
    'A summary of historical sales data, including trends, popular items, and busy periods, in a concise text format.'
  ),
  currentInventorySummary: z.string().describe(
    'A summary of current inventory levels, highlighting items near or below reorder points, in a concise text format.'
  ),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});
export type ProactiveOperationalInsightsInput = z.infer<typeof ProactiveOperationalInsightsInputSchema>;

const ProactiveOperationalInsightsOutputSchema = z.object({
  staffingRecommendations: z.array(z.string()).describe(
    'Actionable recommendations for optimal staffing during predicted peak hours or busy days. Each item should be a distinct recommendation.'
  ),
  inventoryReorderSuggestions: z.array(
    z.object({
      item: z.string().describe('The name of the inventory item.'),
      currentStock: z.number().describe('The current stock level of the item.'),
      minimumStock: z.number().describe('The minimum stock level for the item.'),
      suggestedQuantity: z.number().describe('The suggested quantity to reorder.'),
      reason: z.string().describe('The reason for the reorder suggestion.'),
    })
  ).describe('Suggestions for inventory reorders to prevent stockouts.'),
  dailySalesForecast: z.number().describe('The forecasted sales for the current day.'),
  weeklySalesForecast: z.number().describe('The forecasted sales for the upcoming week.'),
  peakHours: z.array(z.string()).describe('Predicted peak hours for customer traffic. Each item should be a distinct time range (e.g., "12:00-14:00").'),
  busyDays: z.array(z.string()).describe('Predicted busy days of the week. Each item should be a distinct day.'),
});
export type ProactiveOperationalInsightsOutput = z.infer<typeof ProactiveOperationalInsightsOutputSchema>;

export async function generateProactiveOperationalInsights(
  input: ProactiveOperationalInsightsInput
): Promise<ProactiveOperationalInsightsOutput> {
  return proactiveOperationalInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proactiveOperationalInsightsPrompt',
  input: { schema: ProactiveOperationalInsightsInputSchema },
  output: { schema: ProactiveOperationalInsightsOutputSchema },
  prompt: `You are an expert operational insights analyst for a restaurant POS system. Your goal is to analyze provided historical sales and current inventory data to generate actionable recommendations and forecasts. Focus on practical advice for staffing and inventory management.

Today's Date: {{{currentDate}}}

Historical Sales Summary:
{{{historicalSalesSummary}}}

Current Inventory Summary:
{{{currentInventorySummary}}}

Based on the above information, provide the following:
1. Staffing recommendations for upcoming busy periods.
2. Specific inventory reorder suggestions, including the item, current stock, minimum stock, suggested reorder quantity, and the reason for the suggestion.
3. Daily sales forecast for today.
4. Weekly sales forecast for the upcoming week.
5. Predicted peak hours.
6. Predicted busy days.

Ensure your output is structured precisely according to the provided schema descriptions, in JSON format.`,
});

const proactiveOperationalInsightsFlow = ai.defineFlow(
  {
    name: 'proactiveOperationalInsightsFlow',
    inputSchema: ProactiveOperationalInsightsInputSchema,
    outputSchema: ProactiveOperationalInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
