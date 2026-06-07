/**
 * Zod-based request validation middleware for SMS API routes.
 * Usage: router.post('/endpoint', validateZod(schema), handler)
 */
const { z } = require('zod');

// Middleware factory
const validateZod = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }
  req.body = result.data;
  next();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const email    = z.string().email('Invalid email').toLowerCase().trim();
const password = z.string().min(8, 'Password must be at least 8 characters');
const str      = (label) => z.string({ required_error: `${label} is required` }).min(1, `${label} is required`).trim();
const oid      = z.string().min(1, 'ID required');

// ─── Auth ─────────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password required'),
  rememberMe: z.boolean().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: password
});

const resetPasswordSchema = z.object({
  userId: oid,
  newPassword: password
});

// ─── Super Admin ──────────────────────────────────────────────────────────────
const createSchoolSchema = z.object({
  name: str('School name'),
  address: z.string().optional(),
  contactEmail: email,
  phone: z.string().optional(),
  logo: z.string().url('Must be a valid URL').optional().or(z.literal(''))
});

const createUserSchema = z.object({
  name: str('Name'),
  email,
  role: z.enum(['teacher', 'student', 'principal', 'school'], { errorMap: () => ({ message: 'Invalid role' }) }),
  schoolId: z.string().optional().transform(v => v || undefined),
  phone: z.string().optional(),
  password: z.string().min(6).optional()
});

// ─── Principal ────────────────────────────────────────────────────────────────
const createClassroomSchema = z.object({
  name: str('Classroom name'),
  gradeLevel: z.string().optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional()
});

const createSubjectSchema = z.object({
  name: str('Subject name'),
  classroomId: oid,
  teacherId: z.string().optional(),
  color: z.string().optional()
});

const upsertScheduleSchema = z.object({
  classroomId: oid,
  slots: z.array(z.object({
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
    period: z.string().min(1),
    subjectId: z.string().optional(),
    teacherId: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  }))
});

// ─── Teacher ──────────────────────────────────────────────────────────────────
const createGradeSchema = z.object({
  studentId: oid,
  subjectId: oid,
  classroomId: oid,
  type: z.enum(['quiz', 'midterm', 'final', 'homework', 'participation']),
  score: z.coerce.number().min(0),
  maxScore: z.coerce.number().min(1),
  term: z.string().optional(),
  note: z.string().optional()
});

const createQuizSchema = z.object({
  title: str('Quiz title'),
  classroomId: oid,
  duration: z.coerce.number().int().min(1).optional(),
  dueDate: z.string().optional(),
  questions: z.array(z.object({
    text: z.string().min(1, 'Question text required'),
    type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional()
  })).min(1, 'At least one question required')
});

const createHomeworkSchema = z.object({
  title: str('Homework title'),
  classroomId: oid,
  description: z.string().optional(),
  dueDate: z.string().optional(),
  subjectId: z.string().optional()
});

// ─── School ───────────────────────────────────────────────────────────────────
const schoolCreateMemberSchema = z.object({
  name: str('Name'),
  email,
  phone: z.string().optional(),
  password: z.string().min(6).optional()
});

module.exports = {
  validateZod,
  schemas: {
    loginSchema, changePasswordSchema, resetPasswordSchema,
    createSchoolSchema, createUserSchema,
    createClassroomSchema, createSubjectSchema, upsertScheduleSchema,
    createGradeSchema, createQuizSchema, createHomeworkSchema,
    schoolCreateMemberSchema
  }
};
