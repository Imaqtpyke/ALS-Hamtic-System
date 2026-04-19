import { supabase } from '../supabaseClient';
import { auth } from '../firebase';

export interface EnrollmentForm {
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName: string;
    birthdate: string;
    gender: string;
    address: string;
    email: string;
    phone: string;
    lrn: string;
  };
  educationalBackground: {
    lastGradeLevel: string;
    lastSchoolAttended: string;
    yearLastAttended: string;
    reason: string;
  };
  learningPreferences: {
    learningStyle: string;
    preferredSchedule: string;
    accommodation: string;
  };
  subjects: Array<{ id: number; name: string }>;
  existingId?: string;
}

export const submitEnrollment = async (formData: EnrollmentForm) => {
  const existingId = formData.existingId;
  try {
    const firebaseUid = auth.currentUser?.uid;
    if (!firebaseUid) {
        return {
            success: false,
            error: 'No authenticated user found. Please log in again.'
        };
    }

    // Create enrollment record
    const enrollmentRecord: any = {
      user_id: firebaseUid,
      personal_info: formData.personalInfo,
      educational_background: {
        lastGradeLevel: formData.educationalBackground.lastGradeLevel,
        lastSchoolAttended: formData.educationalBackground.lastSchoolAttended,
        yearLastAttended: formData.educationalBackground.yearLastAttended,
        reason: formData.educationalBackground.reason
      },
      learning_preferences: {
        learningStyle: formData.learningPreferences.learningStyle,
        preferredSchedule: formData.learningPreferences.preferredSchedule,
        accommodation: formData.learningPreferences.accommodation
      },
      subjects: formData.subjects,
      status: 'pending',
      submitted_at: new Date().toISOString()
    };

    if (existingId) {
      enrollmentRecord.is_resubmission = true;
      
      // For updates, we need to fetch and append to history
      const { data: current } = await supabase
        .from('enrollments')
        .select('status_history')
        .eq('id', existingId)
        .single();
      
      const history = current?.status_history || [];
      enrollmentRecord.status_history = [...history, {
        status: 'pending',
        date: new Date().toISOString(),
        notes: 'Application resubmitted after admin feedback',
        updated_by: firebaseUid
      }];

      const { data, error } = await supabase
        .from('enrollments')
        .update(enrollmentRecord)
        .eq('id', existingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } else {
      enrollmentRecord.status_history = [{
        status: 'pending',
        date: new Date().toISOString(),
        notes: 'Enrollment submitted',
        updated_by: firebaseUid
      }];

      const { data, error } = await supabase
        .from('enrollments')
        .insert([enrollmentRecord])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  } catch (error: any) {
    console.error('Error in submitEnrollment:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.'
    };
  }
};

export const getEnrollments = async (status?: 'pending' | 'approved' | 'rejected') => {
  try {
    let query = supabase.from('enrollments').select('*').order('submitted_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return { success: false, error };
  }
};

export const updateEnrollmentStatus = async (id: string, status: 'approved' | 'rejected', adminUid: string, notes?: string) => {
  try {
    // Fetch current status_history
    const { data: current, error: fetchError } = await supabase
      .from('enrollments')
      .select('status_history')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const currentHistory = Array.isArray(current?.status_history) ? current.status_history : [];
    const statusUpdate = {
      status,
      date: new Date().toISOString(),
      notes: notes || '',
      updated_by: adminUid
    };

    const updateFields: any = { status };
    if (status === 'approved') updateFields.approved_at = new Date().toISOString();
    if (status === 'rejected') updateFields.rejected_at = new Date().toISOString();
    updateFields.status_history = [...currentHistory, statusUpdate];
    if (status === 'rejected' && notes) updateFields.rejection_reason = notes;

    const { data, error } = await supabase
      .from('enrollments')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error updating enrollment status:', err);
    return { success: false, error: err };
  }
};
