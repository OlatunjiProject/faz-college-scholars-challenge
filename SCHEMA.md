# Faz Scholars Challenge 2.0 - Database Schema

The following schema represents how the data is structured using MongoDB (Mongoose ORM). If PostgreSQL is preferred, you would use Prisma/TypeORM with a similarly structured relational schema (where ObjectIds would be UUIDs or Auto-Incremented Integers).

## User Schema (`User`)
Represents Students and Admins.

```javascript
const userSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, index: true }, // e.g., FAZ1234
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  status: { type: String, enum: ['active', 'eliminated', 'promoted'], default: 'active' },

  // Personal Info
  fullName: { type: String },
  dob: { type: Date },
  
  // Parent Info
  parentName: { type: String },
  parentEmail: { type: String },
  parentPhone: { type: String },

  // School Info
  school: { type: String },
  studentClass: { type: String },
  teacherName: { type: String },
  teacherEmail: { type: String },
  teacherPhone: { type: String },

  createdAt: { type: Date, default: Date.now },
});
```

## Question Schema (`Question`)
Represents the Question Bank.

```javascript
const questionSchema = new mongoose.Schema({
  subject: { type: String, required: true, index: true }, // e.g., 'Math', 'Science'
  text: { type: String, required: true },
  options: [{ type: String, required: true }], // Array of 4 options
  correctOptionIndex: { type: Number, required: true }, // 0 to 3
  difficultyLevel: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
```

## Exam Configuration Schema (`ExamConfig`)
Used by the Admin to control the live exam state.

```javascript
const examConfigSchema = new mongoose.Schema({
  name: { type: String, default: "Faz Scholars Challenge 2.0 - Round 1" },
  isLive: { type: Boolean, default: false }, // "Master Switch"
  durationMinutes: { type: Number, default: 60 },
  subjectsIncluded: [{ type: String }], 
  updatedAt: { type: Date, default: Date.now },
});
```

## Result Schema (`Result`)
Stores the automated grading outputs.

```javascript
const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamConfig', required: true },
  
  score: { type: Number, required: true, default: 0 },
  maxScore: { type: Number, required: true },
  
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOptionIndex: { type: Number },
    isCorrect: { type: Boolean },
  }],

  submittedAt: { type: Date, default: Date.now },
});
```
