import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Section =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

type SeedQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

type SeedLesson = {
  title: string;
  slug: string;
  summary: string;
  sections: Section[];
  questions: SeedQuestion[];
};

type SeedCourse = {
  title: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  lessons: SeedLesson[];
};

const courses: SeedCourse[] = [
  {
    title: "TikTok LIVE Fundamentals",
    slug: "tiktok-live",
    description:
      "Master the essentials of going live on TikTok — setup, engagement, battles mindset, and growth habits.",
    icon: "Video",
    order: 0,
    lessons: [
      {
        title: "Before You Go LIVE",
        slug: "before-you-go-live",
        summary: "Gear, settings, and mindset for a strong first stream.",
        sections: [
          {
            type: "heading",
            text: "Set the stage",
          },
          {
            type: "paragraph",
            text: "Your stream quality starts before you tap Go LIVE. Lighting, audio, network stability, and a clear plan for the first 15 minutes decide whether viewers stay.",
          },
          {
            type: "list",
            items: [
              "Face a soft light source — avoid backlighting from windows",
              "Use Wi-Fi or a strong cellular signal; close heavy apps",
              "Pin a welcome message and have 3 conversation topics ready",
              "Pick a consistent schedule so fans know when to find you",
            ],
          },
          {
            type: "callout",
            text: "Creators who show up on a schedule grow faster than creators who go live randomly.",
          },
          {
            type: "paragraph",
            text: "Treat every stream like a show: open strong, deliver value, and close with a call to follow and come back next time.",
          },
        ],
        questions: [
          {
            prompt: "What should you avoid for lighting when going live?",
            options: [
              "Facing a soft light source",
              "Sitting with a window behind you",
              "Using consistent lighting each stream",
              "Testing brightness before going live",
            ],
            correctIndex: 1,
            explanation:
              "Backlighting from a window behind you makes your face dark on camera.",
          },
          {
            prompt: "Why is a consistent LIVE schedule important?",
            options: [
              "It guarantees the For You Page",
              "Fans learn when to find you",
              "It replaces the need for engagement",
              "TikTok only allows scheduled streams",
            ],
            correctIndex: 1,
            explanation:
              "Consistency trains your audience to return; there is no guaranteed FYP placement.",
          },
          {
            prompt: "What is a good opening habit for a stream?",
            options: [
              "Stay silent for 10 minutes",
              "Open strong with topics and energy",
              "Wait for gifts before talking",
              "Only read comments after 30 minutes",
            ],
            correctIndex: 1,
            explanation:
              "A strong open with planned topics keeps viewers in the room.",
          },
        ],
      },
      {
        title: "Engaging Your Audience",
        slug: "engaging-your-audience",
        summary: "Keep viewers talking, gifting, and coming back.",
        sections: [
          { type: "heading", text: "Talk with people, not at them" },
          {
            type: "paragraph",
            text: "LIVE is a two-way medium. The algorithm and viewers both respond when you acknowledge comments, ask questions, and make people feel seen.",
          },
          {
            type: "list",
            items: [
              "Greet new names out loud when they enter",
              "Ask yes/no and this-or-that questions often",
              "Repeat good questions so silent viewers can follow",
              "Thank support specifically — name the person and the gift",
            ],
          },
          {
            type: "callout",
            text: "Silence kills retention. If you need a beat, narrate what you are doing.",
          },
          {
            type: "paragraph",
            text: "Pin a topic of the day, run mini polls in chat, and invite followers to suggest the next challenge or battle.",
          },
        ],
        questions: [
          {
            prompt: "What is the best way to acknowledge support?",
            options: [
              "Generic 'thanks everyone'",
              "Name the person and the gift",
              "Wait until the end of the stream",
              "Only thank top gifters once a week",
            ],
            correctIndex: 1,
            explanation:
              "Specific shoutouts make supporters feel recognized and encourage others.",
          },
          {
            prompt: "Which question style works best on LIVE?",
            options: [
              "Open essays only",
              "Yes/no and this-or-that questions",
              "Questions that require a login",
              "No questions — just talk",
            ],
            correctIndex: 1,
            explanation:
              "Low-friction questions get more replies and keep chat moving.",
          },
          {
            prompt: "What should you do during quiet moments?",
            options: [
              "Sit in silence",
              "End the stream immediately",
              "Narrate what you are doing",
              "Turn the camera away",
            ],
            correctIndex: 2,
            explanation: "Narrating avoids dead air that pushes viewers away.",
          },
        ],
      },
      {
        title: "Battles & Gifts Basics",
        slug: "battles-and-gifts-basics",
        summary: "How LIVE battles work and how to treat gifting.",
        sections: [
          { type: "heading", text: "Battles 101" },
          {
            type: "paragraph",
            text: "A LIVE battle pits two creators head-to-head for a short round. Viewers send battle-eligible gifts that convert into points. Higher points win the round.",
          },
          {
            type: "list",
            items: [
              "Learn the invite flow and round timer in your app version",
              "Explain to chat how they can support during the battle",
              "Celebrate effort in wins and losses — attitude is content",
              "Never pressure or guilt viewers for gifts",
            ],
          },
          {
            type: "callout",
            text: "Respectful energy wins long-term supporters. Pressure burns trust.",
          },
          {
            type: "paragraph",
            text: "Use battles as entertainment and community moments — not as a demand. Your agency Battle Exchange tools help coordinate cross-agency matchups.",
          },
        ],
        questions: [
          {
            prompt: "What determines the winner of a LIVE battle?",
            options: [
              "Who has more followers",
              "Who has more battle points from gifts",
              "Who talks the most",
              "Who is verified first",
            ],
            correctIndex: 1,
            explanation: "Battle points from eligible gifts decide the winner.",
          },
          {
            prompt: "How should you treat viewers regarding gifts?",
            options: [
              "Pressure them to spend more",
              "Ignore gifts completely",
              "Thank support without guilt or pressure",
              "Only accept gifts from strangers",
            ],
            correctIndex: 2,
            explanation: "Gratitude without pressure builds a healthy community.",
          },
          {
            prompt: "What is a healthy way to view battles?",
            options: [
              "Entertainment and community moments",
              "A way to shame opponents",
              "A replacement for all content",
              "Something to hide from chat",
            ],
            correctIndex: 0,
            explanation:
              "Battles work best as fun, shared events for your audience.",
          },
        ],
      },
      {
        title: "Safety & Community Standards",
        slug: "safety-and-community-standards",
        summary: "Stay compliant and protect your account.",
        sections: [
          { type: "heading", text: "Protect the account" },
          {
            type: "paragraph",
            text: "One policy violation can freeze your earnings or ban your LIVE access. Know TikTok community guidelines and your local rules before you stream.",
          },
          {
            type: "list",
            items: [
              "No hate speech, harassment, or sexual content",
              "No misleading claims about money or medical topics",
              "Do not show personal addresses or private info on screen",
              "Report brigading or scam comments — do not engage",
            ],
          },
          {
            type: "callout",
            text: "If chat turns hostile, slow it down, ban/mute as needed, and refocus on your topic.",
          },
        ],
        questions: [
          {
            prompt: "Which content can get your LIVE restricted?",
            options: [
              "Greeting viewers by name",
              "Hate speech or harassment",
              "Thanking supporters",
              "Running a battle",
            ],
            correctIndex: 1,
            explanation:
              "Hate speech and harassment violate community standards.",
          },
          {
            prompt: "What should you never show on screen?",
            options: [
              "Your streaming setup",
              "Personal addresses or private info",
              "Chat usernames in a shoutout",
              "On-screen timers",
            ],
            correctIndex: 1,
            explanation: "Never leak private information while live.",
          },
          {
            prompt: "How should you handle hostile chat?",
            options: [
              "Yell back",
              "Ignore all moderation tools",
              "Slow/mute/ban and refocus",
              "End every stream permanently",
            ],
            correctIndex: 2,
            explanation:
              "Use moderation tools, then steer back to positive content.",
          },
        ],
      },
      {
        title: "Growth Habits & Recap",
        slug: "growth-habits-recap",
        summary: "Turn one good stream into a repeatable system.",
        sections: [
          { type: "heading", text: "Build the system" },
          {
            type: "paragraph",
            text: "Growth comes from reps with reflection. After each stream, note what spiked chat, what flopped, and one experiment for next time.",
          },
          {
            type: "list",
            items: [
              "Keep a fixed weekly LIVE calendar",
              "Clip 2–3 highlights per stream for short-form",
              "Track average viewers, watch time, and new follows",
              "Collaborate with peers for cross-pollination",
            ],
          },
          {
            type: "callout",
            text: "Small consistent improvements beat random viral chasing.",
          },
          {
            type: "paragraph",
            text: "You now know setup, engagement, battles, safety, and review habits. Pass the knowledge check to earn your course certificate.",
          },
        ],
        questions: [
          {
            prompt: "What should you review after a stream?",
            options: [
              "Only your gift total",
              "What spiked chat, what flopped, and one experiment",
              "Nothing — instinct is enough",
              "Only competitor drama",
            ],
            correctIndex: 1,
            explanation: "Reflection with a single experiment drives steady growth.",
          },
          {
            prompt: "Which habit best supports growth?",
            options: [
              "Random 3am streams only",
              "A fixed weekly LIVE calendar",
              "Posting zero short-form clips",
              "Ignoring analytics forever",
            ],
            correctIndex: 1,
            explanation: "A predictable schedule trains audience habits.",
          },
          {
            prompt: "What is a smart use of stream highlights?",
            options: [
              "Delete them all",
              "Clip 2–3 moments for short-form content",
              "Only save gift moments",
              "Post them on a rival platform only",
            ],
            correctIndex: 1,
            explanation:
              "Clips extend reach beyond the LIVE window and funnel new viewers.",
          },
        ],
      },
    ],
  },
  {
    title: "Battle Exchange Platform",
    slug: "battle-exchange",
    description:
      "Learn how NMCN Battle Exchange works — matchmaking, coordination, scoring, and post-battle follow-up.",
    icon: "Swords",
    order: 1,
    lessons: [
      {
        title: "What Is Battle Exchange",
        slug: "what-is-battle-exchange",
        summary: "Cross-agency matchmaking for competitive LIVE events.",
        sections: [
          { type: "heading", text: "The platform" },
          {
            type: "paragraph",
            text: "Battle Exchange is NMCN's coordination layer for scheduling and running LIVE battles across agencies — so matchups are fair, tracked, and professional.",
          },
          {
            type: "list",
            items: [
              "Find compatible opponents across partner agencies",
              "Agree on timing, round rules, and stakes beforehand",
              "Keep a shared record of results",
              "Build rivalries that content can grow from",
            ],
          },
          {
            type: "callout",
            text: "Exchange battles should be fun for both sides — communication prevents no-shows and disputes.",
          },
        ],
        questions: [
          {
            prompt: "What is the main purpose of Battle Exchange?",
            options: [
              "Sell gift packs",
              "Coordinate fair cross-agency LIVE battles",
              "Replace your streaming app",
              "Hide battle results",
            ],
            correctIndex: 1,
            explanation:
              "It coordinates fair matchups between agencies and creators.",
          },
          {
            prompt: "What should be agreed before a battle?",
            options: [
              "Nothing in writing",
              "Timing, rules, and stakes",
              "Only the loser's payout",
              "Personal phone numbers of fans",
            ],
            correctIndex: 1,
            explanation: "Clear pre-agreement prevents disputes and no-shows.",
          },
          {
            prompt: "Why do tracked results matter?",
            options: [
              "They create content and trust",
              "They are illegal",
              "They replace engagement",
              "They only help opponents",
            ],
            correctIndex: 0,
            explanation:
              "Records build rivalries, content angles, and professional trust.",
          },
        ],
      },
      {
        title: "Setting Up a Match",
        slug: "setting-up-a-match",
        summary: "From proposal to confirmed slot.",
        sections: [
          { type: "heading", text: "Proposal checklist" },
          {
            type: "paragraph",
            text: "A clean setup includes creator handles, agency contacts, preferred times, format (best-of / single round), and any theme for content.",
          },
          {
            type: "list",
            items: [
              "Confirm both creators can go live at the slot",
              "State the format and point rules clearly",
              "Share a backup time if someone runs late",
              "Announce the battle to your chat in advance",
            ],
          },
        ],
        questions: [
          {
            prompt: "Which detail belongs in a match proposal?",
            options: [
              "Creator handles and preferred time",
              "Fan private messages",
              "Agency payroll data",
              "Unrelated drama",
            ],
            correctIndex: 0,
            explanation: "Handles and timing are essential to confirm the slot.",
          },
          {
            prompt: "Why announce the battle to chat early?",
            options: [
              "To waste time",
              "So supporters can plan to tune in",
              "To avoid streaming",
              "To hide the opponent",
            ],
            correctIndex: 1,
            explanation: "Advance notice helps your audience show up ready.",
          },
          {
            prompt: "What else should you plan with the opponent?",
            options: [
              "A backup time",
              "Their home address",
              "Their password",
              "Nothing ever",
            ],
            correctIndex: 0,
            explanation: "A backup time reduces no-shows and stress.",
          },
        ],
      },
      {
        title: "During the Battle",
        slug: "during-the-battle",
        summary: "Sportsmanship, energy, and clear scoring.",
        sections: [
          { type: "heading", text: "Run it clean" },
          {
            type: "paragraph",
            text: "Call the start, keep energy high, narrate the score for chat, and stay respectful even when the round swings hard.",
          },
          {
            type: "list",
            items: [
              "Congratuate big plays from both sides",
              "Explain scoring so viewers understand",
              "Do not harass or belittle the opponent",
              "Thank supporters after each round",
            ],
          },
          {
            type: "callout",
            text: "Your conduct during a battle is public marketing for your personal brand.",
          },
        ],
        questions: [
          {
            prompt: "How should you treat the opponent mid-battle?",
            options: [
              "With respect and sportsmanship",
              "With insults for views",
              "Ignore them completely on camera",
              "Demand they quit",
            ],
            correctIndex: 0,
            explanation: "Sportsmanship protects your brand and relationships.",
          },
          {
            prompt: "Why explain scoring to chat?",
            options: [
              "So viewers can follow and engage",
              "To fill dead air only",
              "To confuse opponents",
              "It is against the rules not to",
            ],
            correctIndex: 0,
            explanation: "Clear scoring keeps the audience invested.",
          },
          {
            prompt: "What is good post-round behavior?",
            options: [
              "Thank supporters",
              "Blame teammates only",
              "Delete the VOD immediately",
              "Refuse to speak",
            ],
            correctIndex: 0,
            explanation: "Gratitude reinforces supporter loyalty.",
          },
        ],
      },
      {
        title: "Results & Follow-Up",
        slug: "results-and-follow-up",
        summary: "Close the loop and convert the moment.",
        sections: [
          { type: "heading", text: "After the battle" },
          {
            type: "paragraph",
            text: "Confirm the result with the other agency, post a highlight, thank both audiences, and note lessons for the next matchup.",
          },
          {
            type: "list",
            items: [
              "Agree on the official outcome",
              "Clip the best moments for short-form",
              "Tag partner creators when appropriate",
              "Log learnings for next time",
            ],
          },
        ],
        questions: [
          {
            prompt: "What is the first post-battle step?",
            options: [
              "Confirm the official outcome with both sides",
              "Start an argument in chat",
              "Delete all clips",
              "Apply for a new agency",
            ],
            correctIndex: 0,
            explanation: "Agreeing on the result avoids disputes.",
          },
          {
            prompt: "How can a battle content-ify?",
            options: [
              "Clipping highlights for short-form",
              "Posting nothing ever",
              "Only writing long essays",
              "Ignoring both audiences",
            ],
            correctIndex: 0,
            explanation: "Highlights extend the battle's value beyond the live.",
          },
          {
            prompt: "Who should you thank after a battle?",
            options: [
              "Only the winner's fans",
              "Both audiences and supporters",
              "No one",
              "Only the opponent's agency owner",
            ],
            correctIndex: 1,
            explanation: "Thanking both sides is professional and welcoming.",
          },
        ],
      },
      {
        title: "Disputes & Best Practices",
        slug: "disputes-and-best-practices",
        summary: "Handle disagreements without burning bridges.",
        sections: [
          { type: "heading", text: "When things go sideways" },
          {
            type: "paragraph",
            text: "If scores or rules are disputed, pause, restate what was agreed, and escalate through agency contacts — not through public shade.",
          },
          {
            type: "list",
            items: [
              "Refer back to the original written agreement",
              "Keep public posts factual, not petty",
              "Use agency points of contact to resolve",
              "Document recurring issues for platform improvement",
            ],
          },
          {
            type: "callout",
            text: "Professional dispute handling is how you get invited back for bigger matchups.",
          },
        ],
        questions: [
          {
            prompt: "Best first step when a dispute appears?",
            options: [
              "Public shade posts",
              "Restate the original agreement",
              "Leave the agency",
              "Deny everything",
            ],
            correctIndex: 1,
            explanation:
              "Go back to what both sides originally agreed to in writing.",
          },
          {
            prompt: "Where should unresolved issues escalate?",
            options: [
              "Agency points of contact",
              "Random comment sections",
              "Fan DMs",
              "Nowhere — always silent",
            ],
            correctIndex: 0,
            explanation: "Agency contacts are the proper escalation path.",
          },
          {
            prompt: "How should public posts about disputes read?",
            options: [
              "Factually and professionally",
              "As insults",
              "As gossip rumors",
              "As threats",
            ],
            correctIndex: 0,
            explanation: "Professional tone protects reputation.",
          },
        ],
      },
    ],
  },
  {
    title: "Discord for Creators",
    slug: "discord",
    description:
      "Use Discord to run community, coordinate battles, and support your creator brand safely.",
    icon: "MessagesSquare",
    order: 2,
    lessons: [
      {
        title: "Why Discord Matters",
        slug: "why-discord-matters",
        summary: "Own your community beyond the algorithm.",
        sections: [
          { type: "heading", text: "Your home base" },
          {
            type: "paragraph",
            text: "Social platforms change reach daily. Discord is a space you structure — announcements, battle callouts, fan hangouts, and support live there.",
          },
          {
            type: "list",
            items: [
              "Direct access to your most loyal fans",
              "Organized channels for topics and events",
              "Roles to recognize supporters and team",
              "Works alongside TikTok LIVE and Battle Exchange",
            ],
          },
        ],
        questions: [
          {
            prompt: "What is Discord mainly for creators?",
            options: [
              "An owned community home base",
              "Only file storage",
              "Replacing TikTok entirely",
              "Private email marketing spam",
            ],
            correctIndex: 0,
            explanation:
              "Discord is a structured community space you control.",
          },
          {
            prompt: "Which Discord feature organizes topics?",
            options: [
              "Channels",
              "Emojis only",
              "Screen resolution",
              "Unlimited DMs",
            ],
            correctIndex: 0,
            explanation: "Channels keep conversations categorized.",
          },
          {
            prompt: "How does Discord relate to Battle Exchange?",
            options: [
              "It can coordinate callouts and schedules",
              "It is unrelated",
              "It replaces scoring entirely",
              "It is only for memes",
            ],
            correctIndex: 0,
            explanation:
              "Discord is ideal for battle scheduling and coordination.",
          },
        ],
      },
      {
        title: "Server Structure",
        slug: "server-structure",
        summary: "Channels and roles that scale.",
        sections: [
          { type: "heading", text: "Start simple" },
          {
            type: "paragraph",
            text: "Do not drown members in 50 empty channels. Launch with clear categories: Announcements, Community, Battles, Wins, and Support.",
          },
          {
            type: "list",
            items: [
              "# announcements — you or mods only",
              "# introductions — new members say hello",
              "# battle-callouts — schedules and looking-for-group",
              "# wins-and-clips — celebrate results",
              "# support — questions about agency/platform",
            ],
          },
          {
            type: "callout",
            text: "Roles like Member, VIP, and Mod make the server feel alive and moderated.",
          },
        ],
        questions: [
          {
            prompt: "Which channel should be post-restricted?",
            options: [
              "# announcements",
              "# random DMs",
              "# guestbook",
              "# reaction-roles spam",
            ],
            correctIndex: 0,
            explanation: "Announcements should only be posted by staff.",
          },
          {
            prompt: "What is a healthy approach to channels?",
            options: [
              "Few clear channels that scale",
              "100 empty channels day one",
              "No categories ever",
              "Voice-only servers",
            ],
            correctIndex: 0,
            explanation: "Start lean and expand as the community needs it.",
          },
          {
            prompt: "What do roles help with?",
            options: [
              "Permissions and recognition",
              "Faster internet",
              "Video encoding",
              "Gift conversion rates",
            ],
            correctIndex: 0,
            explanation: "Roles control permissions and show status.",
          },
        ],
      },
      {
        title: "Moderation & Safety",
        slug: "moderation-and-safety",
        summary: "Keep the space welcoming and secure.",
        sections: [
          { type: "heading", text: "Protect members" },
          {
            type: "paragraph",
            text: "Set rules, enable verification, train mods, and act quickly on harassment or scam links. Safety is a feature, not an afterthought.",
          },
          {
            type: "list",
            items: [
              "Publish clear rules and pin them",
              "Require verification before full access",
              "Use bots for raid and spam protection",
              "Document mod actions so the team stays consistent",
            ],
          },
        ],
        questions: [
          {
            prompt: "First step for a safe server?",
            options: [
              "Clear published rules",
              "Zero moderation forever",
              "Open DM invites for everyone",
              "Ignoring scam links",
            ],
            correctIndex: 0,
            explanation: "Rules set expectations for members and mods.",
          },
          {
            prompt: "What helps stop raids and spam?",
            options: [
              "Verification and moderation bots",
              "Disabling all channels",
              "Nothing",
              "More public invite links everywhere",
            ],
            correctIndex: 0,
            explanation: "Verification gates and bots reduce raid damage.",
          },
          {
            prompt: "Why document mod actions?",
            options: [
              "Consistency across the team",
              "To leak private info",
              "To bore members",
              "It is illegal not to post them",
            ],
            correctIndex: 0,
            explanation: "Shared logs keep moderation fair and consistent.",
          },
        ],
      },
      {
        title: "Growing & Engaging",
        slug: "growing-and-engaging",
        summary: "Turn silent members into active regulars.",
        sections: [
          { type: "heading", text: "Activity loops" },
          {
            type: "paragraph",
            text: "Post prompts, host voice hangouts before LIVE, celebrate member wins, and give VIP roles to consistent contributors.",
          },
          {
            type: "list",
            items: [
              "Weekly discussion prompts or polls",
              "Go-live alerts in #announcements",
              "Spotlight member clips in #wins",
              "AMA or office-hours voice channels",
            ],
          },
        ],
        questions: [
          {
            prompt: "Which tactic boosts Discord activity?",
            options: [
              "Weekly prompts and go-live alerts",
              "Only posting once a month",
              "Muting everyone",
              "Never celebrating members",
            ],
            correctIndex: 0,
            explanation: "Regular rituals create reasons to return.",
          },
          {
            prompt: "Where should LIVE alerts go?",
            options: [
              "A dedicated announcements channel",
              "Random voice channels",
              "Nowhere",
              "Only in DMs",
            ],
            correctIndex: 0,
            explanation: "A single announcements channel keeps alerts clear.",
          },
          {
            prompt: "How can VIP roles help?",
            options: [
              "Recognize consistent contributors",
              "Hack accounts",
              "Boost internet speed",
              "Disable moderation",
            ],
            correctIndex: 0,
            explanation: "Recognition rewards encourage ongoing participation.",
          },
        ],
      },
      {
        title: "Discord + Academy Wrap-Up",
        slug: "discord-academy-wrap-up",
        summary: "Connect Discord habits to your overall creator system.",
        sections: [
          { type: "heading", text: "Bring it together" },
          {
            type: "paragraph",
            text: "Your stack now includes TikTok LIVE fundamentals, Battle Exchange coordination, and a Discord home base. Cross-promote each pillar so fans always know the next place to show up.",
          },
          {
            type: "list",
            items: [
              "LIVE → invite viewers to Discord for clips and schedules",
              "Discord → announce battles and recaps",
              "Battle Exchange → coordinate through Discord callouts",
              "Academy → share progress and certificates with your team",
            ],
          },
          {
            type: "callout",
            text: "Pass this final knowledge check to unlock your Discord course certificate.",
          },
        ],
        questions: [
          {
            prompt: "How should LIVE and Discord connect?",
            options: [
              "Invite viewers to Discord for clips and schedules",
              "Keep them completely isolated",
              "Delete Discord after each stream",
              "Only use Discord for complaints",
            ],
            correctIndex: 0,
            explanation: "Cross-promotion keeps fans in your ecosystem.",
          },
          {
            prompt: "What is Discord's role with Battle Exchange?",
            options: [
              "Coordinate callouts and recaps",
              "Replace the scoring system",
              "Nothing",
              "Hide battle times",
            ],
            correctIndex: 0,
            explanation: "Discord is a natural coordination hub for battles.",
          },
          {
            prompt: "Why share Academy progress with your team?",
            options: [
              "Alignment and shared standards",
              "It is required by law",
              "It boosts WiFi",
              "It disables moderation",
            ],
            correctIndex: 0,
            explanation:
              "Shared learning keeps your crew consistent and growing together.",
          },
        ],
      },
    ],
  },
];

async function main() {
  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: {
        title: courseData.title,
        description: courseData.description,
        icon: courseData.icon,
        order: courseData.order,
        status: "published",
        passingScore: 70,
      },
      create: {
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        icon: courseData.icon,
        order: courseData.order,
        status: "published",
        passingScore: 70,
      },
    });

    for (let i = 0; i < courseData.lessons.length; i++) {
      const lessonData = courseData.lessons[i];
      const lesson = await prisma.lesson.upsert({
        where: {
          courseId_slug: { courseId: course.id, slug: lessonData.slug },
        },
        update: {
          title: lessonData.title,
          summary: lessonData.summary,
          sections: lessonData.sections,
          order: i,
          status: "published",
        },
        create: {
          courseId: course.id,
          title: lessonData.title,
          slug: lessonData.slug,
          summary: lessonData.summary,
          sections: lessonData.sections,
          order: i,
          status: "published",
        },
      });

      const existingQuestions = await prisma.question.count({
        where: { lessonId: lesson.id },
      });
      if (existingQuestions === 0) {
        await prisma.question.createMany({
          data: lessonData.questions.map((q, qi) => ({
            lessonId: lesson.id,
            prompt: q.prompt,
            type: "multiple_choice",
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation || null,
            order: qi,
          })),
        });
      }
    }

    console.log(`Seeded course: ${courseData.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
