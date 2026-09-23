import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Rename course to Tikfinity
  await prisma.course.update({
    where: { slug: 'tiktok-live' },
    data: { title: 'Tikfinity' },
  });
  console.log('Renamed course to Tikfinity');

  // Lesson 1: Before You Go LIVE - add 2 more questions
  await prisma.question.createMany({
    data: [
      {
        lessonId: 1,
        prompt: 'What is the ideal distance from your light source for even illumination?',
        type: 'multiple_choice',
        options: ['Right against the light', 'About 3–4 feet away', 'As far as possible', 'Behind the camera only'],
        correctIndex: 1,
        explanation: '3–4 feet gives soft, even light without harsh shadows.',
        order: 3,
      },
      {
        lessonId: 1,
        prompt: 'Why close heavy apps before going LIVE?',
        type: 'multiple_choice',
        options: ['To save battery', 'To free up bandwidth and CPU for streaming', 'To hide notifications', 'To make the phone faster for games'],
        correctIndex: 1,
        explanation: 'Heavy apps consume bandwidth and CPU, causing stream lag.',
        order: 4,
      },
    ],
  });

  // Lesson 2: Engaging Your Audience - add 2 more questions
  await prisma.question.createMany({
    data: [
      {
        lessonId: 2,
        prompt: 'How often should you greet new viewers by name?',
        type: 'multiple_choice',
        options: ['Once per stream', 'Every time someone new joins', 'Only when they send a gift', 'Never — it is distracting'],
        correctIndex: 1,
        explanation: 'Greeting each new viewer makes them feel welcome and increases retention.',
        order: 3,
      },
      {
        lessonId: 2,
        prompt: 'What is a good way to handle a controversial comment?',
        type: 'multiple_choice',
        options: ['Argue publicly', 'Ignore and move on / mute if needed', 'Ban the viewer instantly without warning', 'End the stream'],
        correctIndex: 1,
        explanation: 'De-escalate quickly; mute if needed, then refocus on positive content.',
        order: 4,
      },
    ],
  });

  // Lesson 3: Battles & Gifts Basics - add 2 more questions
  await prisma.question.createMany({
    data: [
      {
        lessonId: 3,
        prompt: 'What should you do if you lose a battle?',
        type: 'multiple_choice',
        options: ['Blame your audience', 'Congratulate the winner and thank your supporters', 'Refuse to accept the result', 'Delete the stream replay'],
        correctIndex: 1,
        explanation: 'Good sportsmanship builds long-term community respect.',
        order: 3,
      },
      {
        lessonId: 3,
        prompt: 'Which gifts count toward battle points?',
        type: 'multiple_choice',
        options: ['All gifts', 'Only battle-eligible gifts shown in the battle UI', 'Only diamonds', 'Only gifts over 100 coins'],
        correctIndex: 1,
        explanation: 'Only gifts marked as battle-eligible in the battle UI count toward points.',
        order: 4,
      },
    ],
  });

  // Lesson 4: Safety & Community Standards - add 2 more questions
  await prisma.question.createMany({
    data: [
      {
        lessonId: 4,
        prompt: 'What should you do if someone shares your personal info in chat?',
        type: 'multiple_choice',
        options: ['Reply to them publicly', 'Report, delete the comment, and contact support if needed', 'Share their info back', 'Ignore it'],
        correctIndex: 1,
        explanation: 'Report doxxing immediately; do not engage or amplify the leak.',
        order: 3,
      },
      {
        lessonId: 4,
        prompt: 'Can you promote unlicensed financial advice on LIVE?',
        type: 'multiple_choice',
        options: ['Yes, if you have followers', 'No — financial/medical advice requires proper licensing', 'Only if you add a disclaimer', 'Only in private messages'],
        correctIndex: 1,
        explanation: 'Financial and medical claims require proper licensing; unlicensed advice violates policy.',
        order: 4,
      },
    ],
  });

  // Lesson 5: Growth Habits & Recap - add 2 more questions
  await prisma.question.createMany({
    data: [
      {
        lessonId: 5,
        prompt: 'How many short-form clips should you aim to create per stream?',
        type: 'multiple_choice',
        options: ['Zero', '2–3 high-quality clips', '50+ clips', 'Only the full stream'],
        correctIndex: 1,
        explanation: '2–3 focused clips are more effective than flooding feeds with low-effort cuts.',
        order: 3,
      },
      {
        lessonId: 5,
        prompt: 'What metric matters most for long-term growth?',
        type: 'multiple_choice',
        options: ['One viral stream', 'Consistent weekly calendar and steady improvement', 'Buying followers', 'Changing your name monthly'],
        correctIndex: 1,
        explanation: 'Consistency and iteration build a sustainable audience.',
        order: 4,
      },
    ],
  });

  console.log('Added 2 knowledge check questions to each of 5 lessons (10 new questions total)');
}

main().catch(console.error).finally(() => prisma.$disconnect());