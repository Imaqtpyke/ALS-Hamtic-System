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
    preferredLanguage: string;
    accommodation: string;
  };
  subjects: Array<{ id: number; name: string }>;
}

export const submitEnrollment = async (formData: EnrollmentForm) => {
  try {
    const firebaseUid = auth.currentUser?.uid;
    if (!firebaseUid) {
        // This check should ideally be done before calling submitEnrollment,
        // or handled more gracefully in the UI.
        console.error('No authenticated Firebase user found in submitEnrollment');
        return {
            success: false,
            error: 'No authenticated user found. Please log in again.'
        };
    }

    // Create enrollment record
    // user_id will be set by the database default value: auth.uid()
    const enrollmentRecord = {
      user_id: firebaseUid, // Add Firebase UID to satisfy RLS
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
        preferredLanguage: formData.learningPreferences.preferredLanguage,
        accommodation: formData.learningPreferences.accommodation
      },
      subjects: formData.subjects,
      status: 'pending',
      status_history: [{
        status: 'pending',
        date: new Date().toISOString(),
        notes: 'Enrollment submitted',
        updated_by: firebaseUid // Using Firebase UID for updated_by for now.
                               // Ensure this column type supports string or is handled by backend.
      }],
      submitted_at: new Date().toISOString()
    };

    console.log('Attempting to insert enrollment record...');

    // Use the single Supabase client instance
    const { data, error } = await supabase
      .from('enrollments')
      .insert([enrollmentRecord])
      .select()
      .single();

    if (error) {
      console.error('Error submitting enrollment:', error);
      return {
        success: false,
        error: 'Failed to submit enrollment. Please try again.'
      };
    }

    console.log('Enrollment submitted successfully:', data);

    // Notification email disabled per product decision: admins will review in-panel and contact applicants manually.

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in submitEnrollment:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
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
