const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); 
    // You can also use gemini-1.5-pro for better reasoning
  }

  async generateCampaignInsights(campaignData) {
    try {
      const {
        name,
        audienceSize,
        sentCount,
        failedCount,
        segmentRules,
        deliveryStats
      } = campaignData;

      const deliveryRate = audienceSize > 0 ? ((sentCount / audienceSize) * 100).toFixed(1) : 0;
      const failureRate = audienceSize > 0 ? ((failedCount / audienceSize) * 100).toFixed(1) : 0;

      const prompt = `
Generate a concise, human-readable summary for this marketing campaign performance:

Campaign: ${name}
Target Audience: ${audienceSize} customers
Messages Sent: ${sentCount}
Messages Failed: ${failedCount}
Delivery Rate: ${deliveryRate}%
Failure Rate: ${failureRate}%

Segment Criteria: ${this.formatSegmentRules(segmentRules)}

${deliveryStats ? `Delivery Breakdown:
${deliveryStats.map(stat => `- ${stat.description}: ${stat.count} customers (${stat.rate}% delivery rate)`).join('\n')}` : ''}

Create a 2-3 sentence business insight summary that highlights:
1. Overall campaign reach and performance
2. Key patterns or notable delivery rates by customer segments
3. Actionable insight or recommendation

Keep it professional and concise. Use Indian Rupee (₹) for currency references.
`;

      const result = await this.model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200
        }
      });

      return result.response.text().trim();
    } catch (error) {
      console.error('AI service error:', error);
      return this.getFallbackInsight(campaignData);
    }
  }

  formatSegmentRules(rules) {
    if (!rules || !Array.isArray(rules)) return 'All customers';

    const fieldMap = {
      totalSpent: 'total spending',
      orderCount: 'order count',
      lastOrderDate: 'last order date',
      daysInactive: 'days inactive'
    };

    const operatorMap = {
      gt: 'greater than',
      gte: 'at least',
      lt: 'less than',
      lte: 'at most',
      eq: 'equal to',
      neq: 'not equal to'
    };

    return rules.map(rule => {
      const field = fieldMap[rule.field] || rule.field;
      const operator = operatorMap[rule.operator] || rule.operator;
      let value = rule.value;

      if (rule.field === 'totalSpent') {
        value = `₹${parseFloat(value).toLocaleString()}`;
      }

      return `${field} ${operator} ${value}`;
    }).join(' and ');
  }

  getFallbackInsight(campaignData) {
    const { name, audienceSize, sentCount, failedCount } = campaignData;
    const deliveryRate = audienceSize > 0 ? ((sentCount / audienceSize) * 100).toFixed(1) : 0;

    return `Your campaign "${name}" reached ${audienceSize} customers with ${sentCount} messages delivered successfully (${deliveryRate}% delivery rate). ${failedCount > 0 ? `${failedCount} messages failed to deliver.` : 'All messages were delivered successfully.'} Consider analyzing customer segments for optimization opportunities.`;
  }
}

module.exports = new AIService();
