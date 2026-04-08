import { supabase, isSupabaseConfigured } from '../supabaseClient';

export type AuditAction = 
  | 'approve_enrollment' 
  | 'reject_enrollment' 
  | 'delete_enrollment'
  | 'create_announcement'
  | 'edit_announcement'
  | 'delete_announcement'
  | 'add_subject'
  | 'edit_subject'
  | 'delete_subject'
  | 'upload_module'
  | 'block_user'
  | 'unblock_user'
  | 'delete_account'
  | 'update_user_profile'
  | 'edit_enrollment';

export const logAuditAction = async (
  adminId: string, 
  action: AuditAction, 
  targetType: string, 
  targetId?: string, 
  details: any = {}
) => {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details
      });
    
    if (error) {
      console.error('Audit Logging Error:', error);
    }
  } catch (err) {
    console.error('Critical Audit Logging Failure:', err);
  }
};
