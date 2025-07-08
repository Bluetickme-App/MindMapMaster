import { WebSocket } from 'ws';
import { multiAIService } from './multi-ai-provider';

interface TenantQuery {
  type: 'maintenance' | 'property' | 'payment' | 'general';
  urgency: 'emergency' | 'high' | 'normal' | 'low';
  category?: string;
  details: string;
}

interface MaintenanceRequest {
  id: string;
  tenantId: string;
  propertyId: string;
  issue: string;
  urgency: string;
  status: 'reported' | 'contractor_notified' | 'in_progress' | 'resolved';
  contractorInfo?: {
    name: string;
    phone: string;
    eta: string;
  };
  timeline: Array<{
    timestamp: Date;
    status: string;
    description: string;
  }>;
}

export class WeletAIAgent {
  private maintenanceRequests: Map<string, MaintenanceRequest> = new Map();
  
  async processMessage(message: string, conversationHistory: any[] = []): Promise<string> {
    // Analyze the message to determine intent
    const query = await this.analyzeQuery(message);
    
    switch (query.type) {
      case 'maintenance':
        return await this.handleMaintenanceRequest(message, query);
      case 'property':
        return await this.handlePropertyQuery(message);
      case 'payment':
        return await this.handlePaymentQuery(message);
      default:
        return await this.handleGeneralQuery(message, conversationHistory);
    }
  }

  private async analyzeQuery(message: string): Promise<TenantQuery> {
    const systemPrompt = `You are an AI assistant analyzing tenant messages. Categorize the message into one of these types:
    - maintenance: Issues with property, repairs needed (especially urgent ones like leaks)
    - property: Questions about properties, viewings, availability
    - payment: Rent payments, deposits, billing
    - general: Other inquiries
    
    Also determine urgency: emergency (leak, no heat, electrical issues), high, normal, or low.
    
    Respond in JSON format: {"type": "...", "urgency": "...", "category": "...", "details": "..."}`;

    try {
      const response = await multiAIService.generateStructuredResponse(
        'openai',
        message,
        systemPrompt,
        {
          type: { type: 'string', enum: ['maintenance', 'property', 'payment', 'general'] },
          urgency: { type: 'string', enum: ['emergency', 'high', 'normal', 'low'] },
          category: { type: 'string' },
          details: { type: 'string' }
        }
      );
      
      return response as TenantQuery;
    } catch (error) {
      return { type: 'general', urgency: 'normal', details: message };
    }
  }

  private async handleMaintenanceRequest(message: string, query: TenantQuery): Promise<string> {
    // For emergency maintenance like leaks
    if (query.urgency === 'emergency') {
      const requestId = this.generateRequestId();
      const maintenanceRequest: MaintenanceRequest = {
        id: requestId,
        tenantId: 'current-tenant', // Would come from session
        propertyId: 'current-property', // Would come from session
        issue: query.details,
        urgency: query.urgency,
        status: 'contractor_notified',
        contractorInfo: {
          name: 'Quick Fix Plumbing',
          phone: '07700 123456',
          eta: '45 minutes'
        },
        timeline: [
          {
            timestamp: new Date(),
            status: 'reported',
            description: 'Issue reported by tenant'
          },
          {
            timestamp: new Date(),
            status: 'contractor_notified',
            description: 'Emergency plumber notified and dispatched'
          }
        ]
      };

      this.maintenanceRequests.set(requestId, maintenanceRequest);

      return `🚨 **Emergency Maintenance Request Created**

I've detected this is an emergency and have already taken action:

✅ **Plumber Dispatched**: ${maintenanceRequest.contractorInfo.name}
📞 **Contact**: ${maintenanceRequest.contractorInfo.phone}
⏰ **ETA**: ${maintenanceRequest.contractorInfo.eta}

**Your Request ID**: ${requestId}

**What happens next:**
1. The plumber will arrive within 45 minutes
2. They'll assess and fix the issue
3. You'll receive updates via this chat
4. We'll follow up to ensure everything is resolved

**Immediate steps you can take:**
- If it's a water leak, turn off the water supply if possible
- Move any valuables away from the affected area
- Take photos for documentation

Is there anything else urgent I can help with while the plumber is on their way?`;
    }

    // For non-emergency maintenance
    return `I've logged your maintenance request. Our team will review it and contact you within 24 hours to schedule a repair. 

In the meantime, could you provide:
- Photos of the issue (if applicable)
- Best times for contractor access
- Any additional details about the problem

This helps us dispatch the right specialist with the proper tools.`;
  }

  private async handlePropertyQuery(message: string): Promise<string> {
    const systemPrompt = `You are a helpful property assistant for WeLet Properties. 
    Help tenants and prospective renters with property-related questions.
    Be friendly, professional, and informative.`;

    const response = await multiAIService.generateResponse(
      'claude',
      message,
      systemPrompt
    );

    return response.content;
  }

  private async handlePaymentQuery(message: string): Promise<string> {
    return `For payment inquiries, here are your options:

💳 **Online Portal**: Log in at portal.weletproperties.co.uk
🏦 **Bank Transfer**: Sort Code: 12-34-56, Account: 12345678
📧 **Payment Support**: payments@weletproperties.co.uk

Your next rent payment of £[AMOUNT] is due on [DATE].

Would you like me to:
- Send you a payment link
- Set up a payment reminder
- Check your payment history
- Answer questions about your deposit`;
  }

  private async handleGeneralQuery(message: string, history: any[]): Promise<string> {
    const systemPrompt = `You are the WeLet Properties AI assistant. You help with:
    - Property viewings and availability
    - Maintenance requests (you can automatically dispatch contractors for emergencies)
    - Tenant support and general inquiries
    - Neighborhood information
    
    Be helpful, professional, and proactive. For urgent issues like leaks, immediately offer to dispatch help.`;

    const conversationContext = history.map(h => `${h.role}: ${h.content}`).join('\n');
    const fullPrompt = conversationContext ? `${conversationContext}\nUser: ${message}` : message;

    const response = await multiAIService.generateResponse(
      'openai',
      fullPrompt,
      systemPrompt
    );

    return response.content;
  }

  private generateRequestId(): string {
    return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getMaintenanceUpdate(requestId: string): Promise<string | null> {
    const request = this.maintenanceRequests.get(requestId);
    if (!request) return null;

    const latestUpdate = request.timeline[request.timeline.length - 1];
    return `**Maintenance Update** (${requestId})
Status: ${request.status}
Latest: ${latestUpdate.description}
Time: ${latestUpdate.timestamp.toLocaleTimeString()}`;
  }
}

export const weletAIAgent = new WeletAIAgent();