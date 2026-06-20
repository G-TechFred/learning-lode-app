import { supabase } from "./supabase";

export const gradesService = {
  // Add a grade record
  async addGrade(
    studentId: string,
    teacherId: string,
    subject: string,
    grade: number,
    attendance: number,
    participation: number,
    remark: string
  ) {
    try {
      const { data, error } = await supabase.from("grades").insert({
        student_id: studentId,
        teacher_id: teacherId,
        subject,
        grade,
        attendance,
        participation,
        remark,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get grades for a student
  async getStudentGrades(studentId: string) {
    try {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", studentId)
        .order("recorded_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get all students for a teacher
  async getTeacherStudents(teacherId: string) {
    try {
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("school_id")
        .eq("id", teacherId)
        .single();

      if (teacherError) throw teacherError;

      const { data: students, error } = await supabase
        .from("students")
        .select("*")
        .eq("school_id", teacher.school_id);

      if (error) throw error;
      return { data: students, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update a grade record
  async updateGrade(
    gradeId: string,
    updates: {
      grade?: number;
      attendance?: number;
      participation?: number;
      remark?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from("grades")
        .update(updates)
        .eq("id", gradeId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Delete a grade record
  async deleteGrade(gradeId: string) {
    try {
      const { error } = await supabase.from("grades").delete().eq("id", gradeId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};

export const studentsService = {
  // Get all students in a school
  async getSchoolStudents(schoolId: string) {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("school_id", schoolId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get student details with grades
  async getStudentWithGrades(studentId: string) {
    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;

      const { data: grades, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", studentId);

      if (gradesError) throw gradesError;

      return { student, grades, error: null };
    } catch (error) {
      return { student: null, grades: null, error };
    }
  },

  // Get parent's children
  async getParentChildren(parentId: string) {
    try {
      const { data, error } = await supabase
        .from("parent_students")
        .select("students(*)")
        .eq("parent_id", parentId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Link parent to student
  async linkParentToStudent(parentId: string, studentId: string) {
    try {
      const { data, error } = await supabase
        .from("parent_students")
        .insert({ parent_id: parentId, student_id: studentId });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

export const teachersService = {
  // Get teacher profile
  async getTeacherProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get teacher's statistics
  async getTeacherStats(teacherId: string) {
    try {
      // Get all students taught
      const { data: students, error: studentsError } = await supabase
        .from("grades")
        .select("student_id")
        .eq("teacher_id", teacherId);

      if (studentsError) throw studentsError;

      const uniqueStudents = [...new Set(students.map((g) => g.student_id))];

      // Get average grade
      const { data: grades, error: gradesError } = await supabase
        .from("grades")
        .select("grade")
        .eq("teacher_id", teacherId);

      if (gradesError) throw gradesError;

      const avgGrade =
        grades.length > 0
          ? Math.round(grades.reduce((sum, g) => sum + g.grade, 0) / grades.length)
          : 0;

      return {
        data: {
          totalStudents: uniqueStudents.length,
          totalGradesRecorded: grades.length,
          averageGrade: avgGrade,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  },
};

export const usersService = {
  // Update user profile
  async updateProfile(userId: string, updates: { first_name?: string; last_name?: string; school_name?: string }) {
    try {
      const { data, error } = await supabase.from("users").update(updates).eq("id", userId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get user by email
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("email", email).single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
