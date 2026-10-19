/**
 * Airtable integration for lead storage
 *
 * Setup:
 * 1. Create Airtable base called "Lead Scans"
 * 2. Create table "Leads" with columns:
 *    - Business Name (text)
 *    - Website (url)
 *    - City (text)
 *    - Email (email)
 *    - Lead Score (number, 0-100)
 *    - Band (single select: Critical, Opportunity, Good)
 *    - Status (single select: New, Contacted, Booked, Won)
 *    - Created At (date)
 * 3. Generate API token at https://airtable.com/account/tokens
 * 4. Add to .env:
 *    AIRTABLE_TOKEN=your_token
 *    AIRTABLE_BASE_ID=your_base_id
 */

export class AirtableClient {
  constructor(token, baseId) {
    this.token = token;
    this.baseId = baseId;
    this.apiUrl = 'https://api.airtable.com/v0';
  }

  async createLead(leadData) {
    if (!this.token || !this.baseId) {
      console.warn('Airtable not configured, skipping lead creation');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/${this.baseId}/Leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                'Business Name': leadData.businessName,
                'Website': leadData.website,
                'City': leadData.city,
                'Email': leadData.email,
                'Lead Score': leadData.score,
                'Band': leadData.band.charAt(0).toUpperCase() + leadData.band.slice(1),
                'Status': 'New',
                'Created At': new Date().toISOString().split('T')[0]
              }
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Airtable error: ${error.error.message}`);
      }

      const result = await response.json();
      console.log('Lead saved to Airtable:', result.records[0].id);
      return result.records[0];
    } catch (error) {
      console.error('Failed to save lead to Airtable:', error);
      // Don't throw - continue without Airtable
      return null;
    }
  }

  async getLead(recordId) {
    if (!this.token || !this.baseId) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/${this.baseId}/Leads/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lead');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get lead from Airtable:', error);
      return null;
    }
  }

  async updateLead(recordId, updates) {
    if (!this.token || !this.baseId) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/${this.baseId}/Leads/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: updates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update lead in Airtable:', error);
      return null;
    }
  }
}

// Initialize client from environment variables
export function initAirtable() {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!token || !baseId) {
    console.warn('Airtable not configured (set AIRTABLE_TOKEN and AIRTABLE_BASE_ID)');
    return null;
  }

  return new AirtableClient(token, baseId);
}
