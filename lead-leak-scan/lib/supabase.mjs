import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing environment variables - data will not be saved');
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function saveScanToSupabase(scanData) {
  if (!supabase) {
    console.log('[Supabase] Not configured - skipping save');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('scans')
      .insert([{
        business_name: scanData.businessName,
        website: scanData.website,
        city: scanData.city,
        email: scanData.email,
        business_type: scanData.businessType || 'other',
        overall_score: scanData.overallScore,
        pixel_audit_score: scanData.pixelAuditScore,
        ai_visibility_score: scanData.aiVisibilityScore,
        lead_friction_score: scanData.leadFrictionScore,
        reputation_gap_score: scanData.reputationGapScore,
        findings: scanData.findings || [],
        business_intelligence_findings: scanData.businessIntelligenceFindings || [],
        tech_stack: scanData.businessIntelligence?.techStack || null,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('[Supabase] Insert error:', error);
      return null;
    }

    console.log('[Supabase] Scan saved successfully:', data?.[0]?.id);
    return data?.[0];
  } catch (err) {
    console.error('[Supabase] Save error:', err);
    return null;
  }
}
