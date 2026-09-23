import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Rename back to original
  await prisma.course.update({
    where: { slug: 'tiktok-live' },
    data: { title: 'TikTok LIVE Fundamentals' },
  });
  console.log('Renamed back to TikTok LIVE Fundamentals');

  // Create new Tikfinity course
  const course = await prisma.course.create({
    data: {
      title: 'Tikfinity',
      slug: 'tikfinity',
      description: 'Master TikTok LIVE growth with proven strategies — from first stream to sustainable creator business. Covers setup, engagement, battles, monetization, and long-term growth systems.',
      icon: 'Video',
      passingScore: 70,
      order: 0,
      status: 'published',
      role: 'creator',
      allowedRoles: [],
    },
  });
  console.log('Created Tikfinity course:', course.id);

  // Lesson 1: First Stream Setup
  const l1 = await prisma.lesson.create({
    data: {
      courseId: course.id,
      title: 'First Stream Setup',
      slug: 'first-stream-setup',
      summary: 'Complete pre-flight checklist — lighting, audio, internet, and mindset for a confident first LIVE.',
      sections: [
        { type: 'heading', text: 'Your First Stream Checklist' },
        { type: 'paragraph', text: 'Preparation separates smooth first streams from technical disasters. Run this checklist 30 minutes before every broadcast.' },
        { type: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { type: 'list', items: [
          'Soft key light at 45° — no backlighting from windows',
          'External mic or wired earbuds; test audio levels',
          'Wi-Fi 5GHz or strong cellular; close background apps',
          'Pin welcome message + 3 conversation starters',
          'Hydration, charger, and "do not disturb" sign on door',
        ]},
        { type: 'callout', text: 'A consistent weekly schedule trains your audience more than any single viral stream.' },
      ],
      order: 0,
      status: 'published',
    },
  });

  await prisma.question.createMany({
    data: [
      { lessonId: l1.id, prompt: 'What is the ideal key-light position for a first stream?', type: 'multiple_choice', options: ['Directly overhead', '45° angle, slightly above eye level', 'Behind you facing the wall', 'On the floor pointing up'], correctIndex: 1, explanation: '45° key light gives dimensional, flattering illumination without harsh shadows.', order: 0 },
      { lessonId: l1.id, prompt: 'Why close background apps before going LIVE?', type: 'multiple_choice', options: ['To save battery', 'To free bandwidth and CPU for stable streaming', 'To hide notifications', 'To make the phone faster for games'], correctIndex: 1, explanation: 'Background apps consume bandwidth and CPU, causing dropped frames and lag.', order: 1 },
      { lessonId: l1.id, prompt: 'What should you pin before going live?', type: 'multiple_choice', options: ['Your bio', 'Welcome message with schedule and CTA', 'A random emoji', 'The current time'], correctIndex: 1, explanation: 'A pinned welcome message orients new viewers and drives follows.', order: 2 },
      { lessonId: l1.id, prompt: 'How far should your key light be from your face for soft illumination?', type: 'multiple_choice', options: ['Right against the skin', 'About 3–4 feet', 'As far as the room allows', 'Behind the camera only'], correctIndex: 1, explanation: '3–4 feet creates soft, wrap-around light without hot spots.', order: 3 },
    ],
  });

  // Lesson 2: Engagement & Retention
  const l2 = await prisma.lesson.create({
    data: {
      courseId: course.id,
      title: 'Engagement & Retention',
      slug: 'engagement-retention',
      summary: 'Turn passive viewers into active community — greetings, questions, polls, and shoutout systems that keep chat moving.',
      sections: [
        { type: 'heading', text: 'Two-Way Energy' },
        { type: 'paragraph', text: 'LIVE is a conversation, not a broadcast. The algorithm and viewers both reward streams where people feel heard.' },
        { type: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { type: 'list', items: [
          'Greet every new name out loud within 5 seconds',
          'Ask low-friction questions: yes/no, this-or-that, number polls',
          'Repeat good questions so lurkers can follow',
          'Shout out every gift by name + gift name',
          'Pin a "topic of the day" and reference it repeatedly',
        ]},
        { type: 'callout', text: 'Dead air loses viewers faster than bad content. Narrate what you are doing if you need a beat.' },
      ],
      order: 1,
      status: 'published',
    },
  });

  await prisma.question.createMany({
    data: [
      { lessonId: l2.id, prompt: 'Which question type generates the most replies on LIVE?', type: 'multiple_choice', options: ['Open essays', 'Yes/no and this-or-that', 'Questions requiring a login', 'No questions at all'], correctIndex: 1, explanation: 'Low-friction binary choices maximize reply rate and keep chat scrolling.', order: 0 },
      { lessonId: l2.id, prompt: 'How should you acknowledge a gift?', type: 'multiple_choice', options: ['Generic "thanks everyone"', 'Name the person + gift name', 'Wait until stream end', 'Only thank top 3 gifters'], correctIndex: 1, explanation: 'Specific shoutouts make supporters feel seen and encourage others.', order: 1 },
      { lessonId: l2.id, prompt: 'What is a good "topic of the day" technique?', type: 'multiple_choice', options: ['Change it every 2 minutes', 'Pin one theme and reference it throughout the stream', 'Let chat vote on 5 topics at once', 'Never use topics'], correctIndex: 1, explanation: 'A single pinned theme gives new viewers instant context.', order: 2 },
      { lessonId: l2.id, prompt: 'How should you handle a controversial comment?', type: 'multiple_choice', options: ['Argue publicly to show dominance', 'Ignore / mute / ban if needed, then refocus', 'Ban instantly without warning', 'End the stream immediately'], correctIndex: 1, explanation: 'De-escalate fast; moderate if needed, then steer back to positive energy.', order: 2 },
    ],
  });

  // Lesson 3: Battles & Monetization
  const l3 = await prisma.lesson.create({
    data: {
      courseId: course.id,
      title: 'Battles & Monetization',
      slug: 'battles-monetization',
      summary: 'Win battles ethically, maximize gift revenue, and convert battle viewers into long-term supporters.',
      sections: [
        { type: 'heading', text: 'Battle Mechanics & Ethics' },
        { type: 'paragraph', text: 'Battles convert viewer energy into points and revenue. Understand the invite flow, round timer, and battle-eligible gifts before you accept a match.' },
        { type: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { type: 'list', items: [
          'Learn the invite flow and round timer in your app version',
          'Explain to chat how they can support during the battle',
          'Celebrate effort in wins and losses — attitude is content',
          'Never pressure or guilt viewers for gifts',
          'Post-battle: thank opponents, clip highlights, funnel new viewers to follow',
        ]},
        { type: 'callout', text: 'Pressure burns trust. Gratitude without guilt builds a community that sustains you.' },
      ],
      order: 2,
      status: 'published',
    },
  });

  await prisma.question.createMany({
    data: [
      { lessonId: l3.id, prompt: 'What determines the winner of a TikTok LIVE battle?', type: 'multiple_choice', options: ['Follower count', 'Battle points from eligible gifts', 'Who talks the most', 'Verification status'], correctIndex: 1, explanation: 'Only battle-eligible gifts shown in the battle UI convert to points.', order: 0 },
      { lessonId: l3.id, prompt: 'How should you handle a loss?', type: 'multiple_choice', options: ['Blame chat for not gifting enough', 'Congratulate the winner and thank your supporters', 'Delete the replay and pretend it never happened', 'Demand a rematch immediately'], correctIndex: 1, explanation: 'Grace in defeat builds long-term respect and community loyalty.', order: 1 },
      { lessonId: l3.id, prompt: 'Which gifts count toward battle points?', type: 'multiple_choice', options: ['All gifts', 'Only battle-eligible gifts shown in the battle UI', 'Only diamonds', 'Only gifts over 100 coins'], correctIndex: 1, explanation: 'Only gifts marked as battle-eligible in the battle UI convert to points.', order: 2 },
      { lessonId: l3.id, prompt: 'What is the healthiest mindset toward gifting?', type: 'multiple_choice', options: ['Expect gifts every stream', 'Gratitude without pressure; gifts are bonus, not requirement', 'Only stream when gifts are guaranteed', 'Guilt viewers who do not gift'], correctIndex: 1, explanation: 'Gratitude without obligation creates sustainable support.', order: 3 },
    ],
  });

  // Lesson 4: Safety, Compliance & Brand Safety
  const l4 = await prisma.lesson.create({
    data: {
      courseId: course.id,
      title: 'Safety, Compliance & Brand Safety',
      slug: 'safety-compliance-brand-safety',
      summary: 'Protect your account, follow TikTok guidelines, and build a brand-safe stream that attracts partnerships.',
      sections: [
        { type: 'heading', text: 'Protect Your Asset' },
        { type: 'paragraph', text: 'One policy strike can freeze earnings or ban LIVE access. Know the lines before you cross them.' },
        { type: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { type: 'list', items: [
          'Zero tolerance: hate speech, harassment, sexual content, self-harm',
          'No misleading medical, financial, or legal claims without credentials',
          'Never show addresses, phone numbers, or private documents on screen',
          'Report brigading/scam comments — do not engage',
          'Use slow mode, keyword filters, and trusted mods for hostile chat',
        ]},
        { type: 'callout', text: 'Brand-safe streams attract agency deals and TikTok program invitations.' },
      ],
      order: 3,
      status: 'published',
    },
  });

  await prisma.question.createMany({
    data: [
      { lessonId: l4.id, prompt: 'What should you never show on screen?', type: 'multiple_choice', options: ['Your streaming setup', 'Personal addresses or private documents', 'Chat usernames in a shoutout', 'On-screen timers'], correctIndex: 1, explanation: 'Doxxing yourself or others violates safety policy and endangers you.', order: 0 },
      { lessonId: l4.id, prompt: 'Can you give unlicensed financial advice on LIVE?', type: 'multiple_choice', options: ['Yes, if you have followers', 'No — financial/medical/legal advice requires proper licensing', 'Only with a disclaimer', 'Only in private messages'], correctIndex: 1, explanation: 'Unlicensed financial, medical, or legal claims violate TikTok policy and local law.', order: 1 },
      { lessonId: l4.id, prompt: 'How should you handle a coordinated harassment raid?', type: 'multiple_choice', options: ['Argue with each person', 'Enable slow mode, use keyword filters, empower mods, report to TikTok', 'Turn off chat completely', 'End the stream and quit'], correctIndex: 1, explanation: 'Tools + moderation + reporting = effective defense.', order: 2 },
      { lessonId: l4.id, prompt: 'Why does brand safety matter for monetization?', type: 'multiple_choice', options: ['It does not', 'Brands and TikTok programs prefer policy-compliant creators', 'Only for verified creators', 'Only for battles'], correctIndex: 1, explanation: 'Clean records unlock TikTok programs, agency deals, and brand partnerships.', order: 2 },
    ],
  });

  // Lesson 5: Growth Systems & Long-Term Business
  const l5 = await prisma.lesson.create({
    data: {
      courseId: course.id,
      title: 'Growth Systems & Long-Term Business',
      slug: 'growth-systems-long-term-business',
      summary: 'Build a repeatable system — calendar, analytics, clips, collaborations — that turns one good stream into a sustainable creator business.',
      sections: [
        { type: 'heading', text: 'Build the System' },
        { type: 'paragraph', text: 'Viral moments fade. Systems compound. After every stream: note what spiked, what flopped, and one experiment for next time.' },
        { type: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { type: 'list', items: [
          'Fixed weekly LIVE calendar (same days/times)',
          'Clip 2–3 highlights per stream for Reels/TikTok/Shorts',
          'Track: avg viewers, watch time, new follows, gift revenue',
          'Monthly collab with a peer for cross-pollination',
          'Quarterly review: double down on top 20% of content types',
        ]},
        { type: 'callout', text: 'Small consistent improvements beat chasing viral lottery tickets.' },
      ],
      order: 4,
      status: 'published',
    },
  });

  await prisma.question.createMany({
    data: [
      { lessonId: l5.id, prompt: 'What is the most effective post-stream habit?', type: 'multiple_choice', options: ['Check only gift total', 'Note what spiked, what flopped, and one experiment for next time', 'Nothing — instinct is enough', 'Delete the replay'], correctIndex: 1, explanation: 'Structured reflection with one experiment drives compounding improvement.', order: 0 },
      { lessonId: l5.id, prompt: 'How many short-form clips should you create per stream?', type: 'multiple_choice', options: ['Zero', '2–3 high-quality clips', '50+ clips', 'Only the full stream'], correctIndex: 1, explanation: '2–3 focused clips outperform flooding feeds with low-effort cuts.', order: 1 },
      { lessonId: l5.id, prompt: 'Which metric signals sustainable growth?', type: 'multiple_choice', options: ['One viral stream', 'Consistent weekly calendar + steady metric improvement', 'Buying followers', 'Changing your name monthly'], correctIndex: 1, explanation: 'Consistency and iteration compound; viral spikes do not.', order: 2 },
      { lessonId: l5.id, prompt: 'What is the purpose of a quarterly content review?', type: 'multiple_choice', options: ['To waste time', 'Double down on the top 20% of content types that perform', 'To delete old videos', 'To change your niche every quarter'], correctIndex: 1, explanation: 'Pareto analysis focuses effort on what actually works.', order: 3 },
    ],
  });

  console.log('Created Tikfinity course with 5 lessons, YouTube sections, knowledge checks, summaries, and course description');
}

main().catch(console.error).finally(() => prisma.$disconnect());