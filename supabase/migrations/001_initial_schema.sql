-- Users table (extends Supabase auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'parent')),
  school_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  school_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  school_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grades/Performance table
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('Math', 'Science', 'English', 'History')),
  grade INTEGER NOT NULL CHECK (grade >= 0 AND grade <= 100),
  attendance INTEGER NOT NULL CHECK (attendance >= 0 AND attendance <= 100),
  participation INTEGER NOT NULL CHECK (participation >= 0 AND participation <= 10),
  remark TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent-Student relationship table
CREATE TABLE public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for Students
CREATE POLICY "Teachers can view students in their school"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.users u ON t.user_id = u.id
      WHERE u.id = auth.uid() AND t.school_id = students.school_id
    )
  );

CREATE POLICY "Students can view their own profile"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'student' AND students.user_id = u.id
    )
  );

CREATE POLICY "Parents can view their children"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_students
      WHERE parent_students.student_id = students.id
      AND parent_students.parent_id = auth.uid()
    )
  );

-- RLS Policies for Grades
CREATE POLICY "Teachers can view grades for their students"
  ON public.grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.users u ON t.user_id = u.id
      WHERE u.id = auth.uid() AND t.id = grades.teacher_id
    )
  );

CREATE POLICY "Students can view their own grades"
  ON public.grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = grades.student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's grades"
  ON public.grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_students ps
      WHERE ps.student_id = grades.student_id
      AND ps.parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert grades"
  ON public.grades FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.users u ON t.user_id = u.id
      WHERE u.id = auth.uid() AND t.id = grades.teacher_id
    )
  );

CREATE POLICY "Teachers can update their own grades"
  ON public.grades FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.users u ON t.user_id = u.id
      WHERE u.id = auth.uid() AND t.id = grades.teacher_id
    )
  );

-- RLS Policies for Parent-Student relationships
CREATE POLICY "Parents can view their own relationships"
  ON public.parent_students FOR SELECT
  USING (auth.uid() = parent_id);

-- Create indexes for better query performance
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_school_id ON public.students(school_id);
CREATE INDEX idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX idx_grades_recorded_at ON public.grades(recorded_at);
CREATE INDEX idx_parent_students_parent_id ON public.parent_students(parent_id);
CREATE INDEX idx_parent_students_student_id ON public.parent_students(student_id);
