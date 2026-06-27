require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Question = require('../models/Question');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/interview_db');
  console.log('✅ MongoDB connected for seeding');
};

// ---- All questions from your existing questionSeed.js ----
const technicalQuestions = [
  { topic: 'JavaScript', question: 'Which keyword declares a block-scoped variable in JavaScript?', options: ['var', 'let', 'static', 'global'], answer: 'let', type: 'Technical', difficulty: 'Easy' },
  { topic: 'React', question: 'Which hook is used to run side effects in a React function component?', options: ['useMemo', 'useEffect', 'useRef', 'useReducer'], answer: 'useEffect', type: 'Technical', difficulty: 'Easy' },
  { topic: 'HTML', question: 'Which element is used for the largest heading in HTML?', options: ['h6', 'heading', 'h1', 'head'], answer: 'h1', type: 'Technical', difficulty: 'Easy' },
  { topic: 'CSS', question: 'Which CSS property controls the space inside an element border?', options: ['margin', 'padding', 'gap', 'outline'], answer: 'padding', type: 'Technical', difficulty: 'Easy' },
  { topic: 'Node.js', question: 'Which module system does Node.js commonly use with require?', options: ['CommonJS', 'AMD', 'SystemJS', 'BabelJS'], answer: 'CommonJS', type: 'Technical', difficulty: 'Easy' },
  { topic: 'Database', question: 'Which SQL command is used to read records from a table?', options: ['INSERT', 'SELECT', 'UPDATE', 'DROP'], answer: 'SELECT', type: 'Technical', difficulty: 'Easy' },
  { topic: 'Git', question: 'Which command creates a new local Git branch and switches to it?', options: ['git branch -d', 'git checkout -b', 'git push -u', 'git merge'], answer: 'git checkout -b', type: 'Technical', difficulty: 'Medium' },
  { topic: 'API', question: 'Which HTTP method is usually used to create a new resource?', options: ['GET', 'POST', 'HEAD', 'OPTIONS'], answer: 'POST', type: 'Technical', difficulty: 'Easy' },
  { topic: 'Security', question: 'What is the main purpose of hashing a password?', options: ['To compress it', 'To store it safely', 'To make it faster', 'To translate it'], answer: 'To store it safely', type: 'Technical', difficulty: 'Medium' },
  { topic: 'System Design', question: 'Which component is commonly used to decouple producers and consumers?', options: ['Message queue', 'CSS grid', 'Browser cookie', 'HTML form'], answer: 'Message queue', type: 'Technical', difficulty: 'Medium' },
  { topic: 'JavaScript', question: 'What does the === operator check in JavaScript?', options: ['Only value', 'Only type', 'Both value and type', 'Neither'], answer: 'Both value and type', type: 'Technical', difficulty: 'Easy' },
  { topic: 'React', question: 'What is the purpose of keys in React lists?', options: ['Style list items', 'Uniquely identify list elements', 'Sort elements', 'Add event handlers'], answer: 'Uniquely identify list elements', type: 'Technical', difficulty: 'Medium' },
];

const hrQuestions = [
  { topic: 'Teamwork', question: 'A teammate disagrees with your approach during a sprint. How do you handle it?', options: ['Ignore them and continue', 'Escalate to the manager immediately', 'Have a 1:1 discussion to understand their perspective', 'Agree with them to avoid conflict'], answer: 'Have a 1:1 discussion to understand their perspective', type: 'HR', difficulty: 'Medium' },
  { topic: 'Conflict', question: 'Your manager gives you feedback you disagree with. What is the best response?', options: ['Dismiss it openly', 'Stay silent and ignore it', 'Listen, then share your view respectfully', 'Complain to colleagues'], answer: 'Listen, then share your view respectfully', type: 'HR', difficulty: 'Medium' },
  { topic: 'Ownership', question: 'You discover a critical bug in production that was your mistake. What do you do first?', options: ['Wait to see if anyone notices', 'Blame the testing team', 'Inform the team and work on a fix immediately', 'Deny involvement'], answer: 'Inform the team and work on a fix immediately', type: 'HR', difficulty: 'Medium' },
  { topic: 'Time Management', question: 'You have two deadlines on the same day. How do you prioritize?', options: ['Work on the easier task first', 'Ask for extensions on both', 'Assess impact and urgency, then communicate proactively', 'Pick one randomly'], answer: 'Assess impact and urgency, then communicate proactively', type: 'HR', difficulty: 'Medium' },
  { topic: 'Communication', question: 'A stakeholder keeps changing requirements. How do you handle this?', options: ['Refuse further changes', 'Silently implement every change', 'Document changes and discuss their impact on the timeline', 'Ignore them'], answer: 'Document changes and discuss their impact on the timeline', type: 'HR', difficulty: 'Hard' },
  { topic: 'Growth', question: 'Which best describes your approach to receiving constructive criticism?', options: ['Get defensive immediately', 'Use it to identify areas for improvement', 'Agree to keep the peace but change nothing', 'Seek a second opinion before accepting it'], answer: 'Use it to identify areas for improvement', type: 'HR', difficulty: 'Easy' },
  { topic: 'Leadership', question: 'A junior teammate is struggling but not asking for help. What do you do?', options: ['Let them figure it out alone', 'Report them to the manager', 'Proactively offer help and pair-program with them', 'Reassign their tasks'], answer: 'Proactively offer help and pair-program with them', type: 'HR', difficulty: 'Medium' },
  { topic: 'Adaptability', question: 'Midway through a project the tech stack changes. How do you respond?', options: ['Resist the change', 'Quit the project', 'Learn what is needed quickly and adapt', 'Complain to the team'], answer: 'Learn what is needed quickly and adapt', type: 'HR', difficulty: 'Medium' },
  { topic: 'Work Ethic', question: 'You finish your tasks early on a Friday. What do you do?', options: ['Log off immediately', 'Browse social media', 'Pick up backlog items or help teammates', 'Take a long break'], answer: 'Pick up backlog items or help teammates', type: 'HR', difficulty: 'Easy' },
];

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing
    await Question.deleteMany({});
    console.log('🗑️  Cleared existing questions');

    const allQuestions = [...technicalQuestions, ...hrQuestions];
    await Question.insertMany(allQuestions);
    console.log(`✅ Seeded ${allQuestions.length} questions successfully`);

    console.log('\n📊 Breakdown:');
    console.log(`   Technical: ${technicalQuestions.length}`);
    console.log(`   HR:        ${hrQuestions.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedDB();
