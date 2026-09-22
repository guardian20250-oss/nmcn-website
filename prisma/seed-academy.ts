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
  role: string;
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
    role: "creator",
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
    role: "creator",
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
    role: "creator",
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
  {
    title: "Team Lead Operations",
    slug: "team-lead-ops",
    description:
      "Run day-to-day creator team operations — assignments, check-ins, and progress tracking for your creators.",
    icon: "UserCog",
    order: 3,
    role: "team_lead",
    lessons: [
      {
        title: "What a Team Lead Does",
        slug: "what-a-team-lead-does",
        summary: "Your role in the creator pipeline and daily operations.",
        sections: [
          { type: "heading", text: "Your lane" },
          {
            type: "paragraph",
            text: "A team lead owns the day-to-day for a small group of creators — scheduling, feedback, and making sure each creator has what they need to perform.",
          },
          {
            type: "list",
            items: [
              "Track each creator's streaming schedule and consistency",
              "Collect quick daily or weekly check-ins from your group",
              "Flag issues early — content gaps, burnout, engagement drops",
              "Coordinate with managers when bigger decisions are needed",
            ],
          },
          {
            type: "callout",
            text: "Team leads translate strategy into routine. Consistency is your main lever.",
          },
        ],
        questions: [
          {
            prompt: "What is the main job of a team lead?",
            options: [
              "Own day-to-day creator operations",
              "Write company-wide policy",
              "Handle every payroll issue",
              "Replace all managers",
            ],
            correctIndex: 0,
            explanation: "Team leads keep the daily routine running for their group.",
          },
          {
            prompt: "Which signal should a team lead watch closely?",
            options: [
              "Creator streaming consistency",
              "Only gift totals",
              "Competitor follower counts",
              "Platform engineering changes",
            ],
            correctIndex: 0,
            explanation: "Consistency and engagement trends are early warning signals.",
          },
          {
            prompt: "When should a team lead escalate to a manager?",
            options: [
              "When bigger decisions are needed",
              "Never — leads do everything alone",
              "Only when asked about lunch",
              "Only after a complaint goes public",
            ],
            correctIndex: 0,
            explanation: "Escalation is for decisions outside the lead's lane.",
          },
        ],
      },
      {
        title: "Managing Creator Teams",
        slug: "managing-creator-teams",
        summary: "Feedback, motivation, and keeping your group aligned.",
        sections: [
          { type: "heading", text: "Lead people, not spreadsheets" },
          {
            type: "paragraph",
            text: "Your creators are performers, not just metrics. Give specific feedback, celebrate progress, and keep goals realistic and visible.",
          },
          {
            type: "list",
            items: [
              "Give feedback tied to specific streams or moments",
              "Set one clear goal per creator per week",
              "Notice burnout signs before they become drop-offs",
              "Keep your group informed about agency priorities",
            ],
          },
          {
            type: "callout",
            text: "Creators who feel seen stay longer and perform better.",
          },
        ],
        questions: [
          {
            prompt: "What makes feedback most useful?",
            options: [
              "Specific to a stream or moment",
              "Vague praise only",
              "Long essays no one reads",
              "Only negative notes",
            ],
            correctIndex: 0,
            explanation: "Specific feedback is actionable and fair.",
          },
          {
            prompt: "How much should a team lead set per creator per week?",
            options: [
              "One clear goal",
              "Fifty competing goals",
              "No goals at all",
              "Goals only for top creators",
            ],
            correctIndex: 0,
            explanation: "One clear goal is easier to track and achieve.",
          },
          {
            prompt: "What is an early burnout signal?",
            options: [
              "Sudden drop in stream consistency",
              "Higher gift totals",
              "More comments than usual",
              "Every viewer leaving at once",
            ],
            correctIndex: 0,
            explanation: "Consistency drops often show up before a full drop-off.",
          },
        ],
      },
    ],
  },
  {
    title: "Managing Creator Teams",
    slug: "managing-creator-teams",
    description:
      "Feedback, motivation, and keeping your group aligned.",
    icon: "UserCog",
    order: 4,
    role: "team_lead",
    lessons: [
      {
        title: "Creator Feedback Loops",
        slug: "creator-feedback-loops",
        summary: "How to give feedback that creators actually use.",
        sections: [
          { type: "heading", text: "Keep it short and specific" },
          {
            type: "paragraph",
            text: "Long reviews get ignored. Pick one win, one issue, and one next step after each review cycle.",
          },
          {
            type: "list",
            items: [
              "Lead with a concrete win from the last stream",
              "Describe the issue as a behavior, not a personality trait",
              "End with one next step the creator can repeat",
              "Follow up on the same point next time",
            ],
          },
          {
            type: "callout",
            text: "Creators improve faster when feedback is short, specific, and repeated.",
          },
        ],
        questions: [
          {
            prompt: "What is the best structure for feedback?",
            options: [
              "One win, one issue, one next step",
              "A ten-page essay",
              "Only praise no matter what",
              "Only criticism no matter what",
            ],
            correctIndex: 0,
            explanation: "Short structured feedback is easier to act on.",
          },
          {
            prompt: "How should you describe an issue?",
            options: [
              "As a behavior, not a personality trait",
              "As a personal attack",
              "By guessing their motives",
              "By comparing to unrelated creators",
            ],
            correctIndex: 0,
            explanation: "Behavior-focused feedback is fair and fixable.",
          },
          {
            prompt: "What makes feedback stick?",
            options: [
              "Following up on the same point next time",
              "Saying it once and forgetting it",
              "Only talking about other creators",
              "Giving no examples at all",
            ],
            correctIndex: 0,
            explanation: "Repeatable follow-up turns advice into a habit.",
          },
        ],
      },
    ],
  },
  {
    title: "Agency Management Basics",
    slug: "agency-management-basics",
    description:
      "Core management skills for running creator operations at Nexus Mafia.",
    icon: "Briefcase",
    order: 5,
    role: "manager",
    lessons: [
      {
        title: "Running Creator Operations",
        slug: "running-creator-ops",
        summary: "How managers keep the agency moving day to day.",
        sections: [
          { type: "heading", text: "Your responsibilities" },
          {
            type: "paragraph",
            text: "Managers translate agency goals into action for team leads and creators — prioritizing work, removing blockers, and keeping standards consistent.",
          },
          {
            type: "list",
            items: [
              "Set clear priorities for the week and month",
              "Make sure team leads have the info they need",
              "Remove blockers before they stall a creator",
              "Keep standards consistent across teams",
            ],
          },
          {
            type: "callout",
            text: "Good managers make the work easier for the people doing it.",
          },
        ],
        questions: [
          {
            prompt: "What is a manager's main job in creator ops?",
            options: [
              "Translate goals into action and remove blockers",
              "Micromanage every stream",
              "Avoid all decisions",
              "Only attend meetings",
            ],
            correctIndex: 0,
            explanation: "Managers clear the path for the team.",
          },
          {
            prompt: "What should a manager do when a creator stalls?",
            options: [
              "Remove blockers early",
              "Wait until the creator quits",
              "Publicly shame the creator",
              "Ignore it and hope for the best",
            ],
            correctIndex: 0,
            explanation: "Early blocker removal keeps momentum alive.",
          },
          {
            prompt: "What keeps standards consistent?",
            options: [
              "Clear priorities across teams",
              "Every team inventing its own rules",
              "No written expectations",
              "Only verbal instructions",
            ],
            correctIndex: 0,
            explanation: "Clear shared priorities keep teams aligned.",
          },
        ],
      },
      {
        title: "Staff & Creator Oversight",
        slug: "staff-creator-oversight",
        summary: "Supporting both your staff and your creators.",
        sections: [
          { type: "heading", text: "Two levels of leadership" },
          {
            type: "paragraph",
            text: "Managers support team leads and scouts, and team leads support creators. When either layer is overloaded, quality drops.",
          },
          {
            type: "list",
            items: [
              "Check in with team leads before checking on creators",
              "Notice when staff are overloaded",
              "Balance creator demands with staff capacity",
              "Keep communication short, direct, and documented",
            ],
          },
          {
            type: "callout",
            text: "A healthy agency protects both the creators and the people managing them.",
          },
        ],
        questions: [
          {
            prompt: "Who do managers support directly?",
            options: [
              "Team leads and scouts",
              "Only their own stream",
              "No one",
              "Only the founder",
            ],
            correctIndex: 0,
            explanation: "Managers work through team leads and scouts.",
          },
          {
            prompt: "What happens when a layer is overloaded?",
            options: [
              "Quality drops",
              "Quality automatically improves",
              "Nothing changes",
              "Only the top performers suffer",
            ],
            correctIndex: 0,
            explanation: "Overloaded layers create bottlenecks and mistakes.",
          },
          {
            prompt: "What is a good communication habit for managers?",
            options: [
              "Short, direct, and documented",
              "Long vague messages",
              "Only in-person shouting",
              "Never documenting anything",
            ],
            correctIndex: 0,
            explanation: "Clear documented communication reduces confusion.",
          },
        ],
      },
    ],
  },
  {
    title: "Creator Discovery & Scouting",
    slug: "creator-discovery-scouting",
    description:
      "How scouts find, evaluate, and bring promising creators into the agency.",
    icon: "Search",
    order: 6,
    role: "scout",
    lessons: [
      {
        title: "How to Spot Talent",
        slug: "how-to-spot-talent",
        summary: "What to look for when evaluating a creator before outreach.",
        sections: [
          { type: "heading", text: "Look beyond follower count" },
          {
            type: "paragraph",
            text: "A big follower count is not enough. Look for engagement, personality, consistency, and the kind of audience the creator has built.",
          },
          {
            type: "list",
            items: [
              "Watch several recent streams, not just one viral clip",
              "Notice how the creator talks with chat",
              "Check consistency of schedule and energy",
              "Think about fit with the agency's brand and goals",
            ],
          },
          {
            type: "callout",
            text: "Good scouts evaluate the whole creator, not just one number.",
          },
        ],
        questions: [
          {
            prompt: "What matters most when scouting a creator?",
            options: [
              "Engagement and consistency across streams",
              "Only one viral clip",
              "Only follower count",
              "The creator's profile photo",
            ],
            correctIndex: 0,
            explanation: "Multiple signals give a fuller picture.",
          },
          {
            prompt: "What should a scout watch before outreach?",
            options: [
              "Several recent streams",
              "Only a single clip",
              "Nothing, just send a message",
              "Only comments from one viewer",
            ],
            correctIndex: 0,
            explanation: "Recent patterns matter more than one moment.",
          },
          {
            prompt: "What is a good fit check for the agency?",
            options: [
              "Brand and goal alignment",
              "Only whether the creator is famous",
              "Only the creator's font choice",
              "Only the camera used",
            ],
            correctIndex: 0,
            explanation: "Fit with the agency determines long-term success.",
          },
        ],
      },
      {
        title: "Evaluating Potential Creators",
        slug: "evaluating-potential-creators",
        summary: "A simple framework for ranking and recommending creators.",
        sections: [
          { type: "heading", text: "Score what you can measure" },
          {
            type: "paragraph",
            text: "Use a simple set of criteria so scouts make comparable recommendations instead of random impressions.",
          },
          {
            type: "list",
            items: [
              "Content quality and personality",
              "Engagement rate and chat activity",
              "Streaming consistency and reliability",
              "Growth trend over the last few weeks",
            ],
          },
          {
            type: "callout",
            text: "A simple scoring framework beats gut feeling when you compare creators.",
          },
        ],
        questions: [
          {
            prompt: "Why use a scoring framework?",
            options: [
              "To compare creators consistently",
              "To slow down every decision",
              "To avoid all outreach",
              "To make every creator identical",
            ],
            correctIndex: 0,
            explanation: "A framework makes comparisons fairer and clearer.",
          },
          {
            prompt: "Which factor belongs in a creator evaluation?",
            options: [
              "Engagement rate",
              "Favorite color",
              "Stream title font",
              "Personal relationships only",
            ],
            correctIndex: 0,
            explanation: "Engagement is a core creator performance signal.",
          },
          {
            prompt: "What trend should scouts track?",
            options: [
              "Growth over recent weeks",
              "Last year's drama",
              "Only one old stream",
              "Only the creator's age",
            ],
            correctIndex: 0,
            explanation: "Recent growth trends are more relevant than old data.",
          },
        ],
      },
    ],
  },
  {
    title: "Scouting Outreach & Tracking",
    slug: "scouting-outreach-tracking",
    description:
      "How to reach out, follow up, and keep clean records on creator prospects.",
    icon: "Mail",
    order: 7,
    role: "scout",
    lessons: [
      {
        title: "Reaching Out to Creators",
        slug: "reaching-out-to-creators",
        summary: "First contact that feels personal and respectful.",
        sections: [
          { type: "heading", text: "Personalize the first message" },
          {
            type: "paragraph",
            text: "Creators get a lot of copy-paste messages. Lead with something specific from their content, keep it short, and make the next step easy.",
          },
          {
            type: "list",
            items: [
              "Mention a recent stream or moment you liked",
              "Keep the message short and specific",
              "Say what the agency offers without overselling",
              "Give an easy next step, like a reply or call time",
            ],
          },
          {
            type: "callout",
            text: "Personal outreach gets replies. Generic outreach gets ignored.",
          },
        ],
        questions: [
          {
            prompt: "What makes outreach more effective?",
            options: [
              "A specific recent moment you liked",
              "The same message for everyone",
              "Only legalese and disclaimers",
              "A very long intro paragraph",
            ],
            correctIndex: 0,
            explanation: "Specificity shows you actually watched the creator.",
          },
          {
            prompt: "What should an outreach message include?",
            options: [
              "A clear next step",
              "Nothing but a link",
              "Only demands",
              "Only praise with no ask",
            ],
            correctIndex: 0,
            explanation: "A clear next step makes reply easy.",
          },
          {
            prompt: "What should you avoid in outreach?",
            options: [
              "Overselling the agency too hard",
              "Being short and specific",
              "Watching the creator first",
              "Sending a follow-up",
            ],
            correctIndex: 0,
            explanation: "Too much pressure pushes creators away.",
          },
        ],
      },
      {
        title: "Tracking Scout Pipeline",
        slug: "tracking-scout-pipeline",
        summary: "Keep every prospect organized so nothing falls through the cracks.",
        sections: [
          { type: "heading", text: "Run a clean pipeline" },
          {
            type: "paragraph",
            text: "Track every creator you discover, what stage they are in, and when to follow up. A pipeline you can trust beats memory.",
          },
          {
            type: "list",
            items: [
              "Log every prospect with a source and date",
              "Move each creator through clear stages",
              "Set a follow-up date for every open lead",
              "Review your pipeline before every reporting cycle",
            ],
          },
          {
            type: "callout",
            text: "If it is not tracked, it is probably forgotten.",
          },
        ],
        questions: [
          {
            prompt: "What should every prospect record include?",
            options: [
              "Source and date",
              "Only the creator's name",
              "Only your opinion",
              "Only the creator's follower count",
            ],
            correctIndex: 0,
            explanation: "Source and date help you track how prospects come in.",
          },
          {
            prompt: "What keeps a pipeline reliable?",
            options: [
              "Clear stages and follow-up dates",
              "Memory alone",
              "Only a single note",
              "No stages at all",
            ],
            correctIndex: 0,
            explanation: "Stages and dates make the pipeline actionable.",
          },
          {
            prompt: "When should you review your pipeline?",
            options: [
              "Before every reporting cycle",
              "Never",
              "Only when something goes viral",
              "Only when someone complains",
            ],
            correctIndex: 0,
            explanation: "Regular review keeps the pipeline current.",
          },
        ],
      },
    ],
  },
  {
    title: "Battle Coordination Fundamentals",
    slug: "battle-coordination-fundamentals",
    description:
      "How battle coordinators set up, communicate, and close out LIVE battles.",
    icon: "Swords",
    order: 8,
    role: "battle_coordinator",
    lessons: [
      {
        title: "What a Battle Coordinator Owns",
        slug: "what-a-battle-coordinator-owns",
        summary: "The coordination steps behind every clean battle.",
        sections: [
          { type: "heading", text: "Your role in a battle" },
          {
            type: "paragraph",
            text: "Battle coordinators make sure both sides agree on timing, format, and expectations before the LIVE starts, and that the result is recorded cleanly afterward.",
          },
          {
            type: "list",
            items: [
              "Confirm both creators and their teams ahead of time",
              "Agree on format, timing, and any stakes upfront",
              "Keep communication clear and documented",
              "Close the loop with a clean post-battle record",
            ],
          },
          {
            type: "callout",
            text: "A good coordinator makes the battle easy to run and hard to dispute.",
          },
        ],
        questions: [
          {
            prompt: "What does a battle coordinator own?",
            options: [
              "Pre-battle setup and post-battle closure",
              "Only the stream title",
              "Only one creator's chat",
              "Only the gift totals",
            ],
            correctIndex: 0,
            explanation: "Coordinators own the full battle flow.",
          },
          {
            prompt: "What must be agreed before a battle?",
            options: [
              "Timing, format, and expectations",
              "Nothing at all",
              "Only the loser's payout",
              "Personal details of fans",
            ],
            correctIndex: 0,
            explanation: "Clear pre-agreement prevents disputes.",
          },
          {
            prompt: "What happens after a battle?",
            options: [
              "Record the result cleanly",
              "Delete everything immediately",
              "Argue in public",
              "Ignore both sides",
            ],
            correctIndex: 0,
            explanation: "Clean closure builds trust for future battles.",
          },
        ],
      },
      {
        title: "Running Cross-Agency Events",
        slug: "running-cross-agency-events",
        summary: "Coordinate multi-agency battles without chaos.",
        sections: [
          { type: "heading", text: "Work across teams cleanly" },
          {
            type: "paragraph",
            text: "Cross-agency battles add complexity because two teams have to align. Make the shared parts explicit and keep each agency's internal prep separate but informed.",
          },
          {
            type: "list",
            items: [
              "Confirm the shared agreement in writing",
              "Keep each agency's internal prep clear",
              "Share only the info both sides need",
              "Use one main point of contact per side",
            ],
          },
          {
            type: "callout",
            text: "Cross-agency events run better when every side knows exactly what is shared and what is internal.",
          },
        ],
        questions: [
          {
            prompt: "What is the hardest part of cross-agency battles?",
            options: [
              "Getting two teams aligned",
              "Choosing a camera",
              "Picking a username",
              "Deciding the weather",
            ],
            correctIndex: 0,
            explanation: "Alignment across teams is the main challenge.",
          },
          {
            prompt: "What should be confirmed in writing?",
            options: [
              "The shared agreement",
              "Only the snacks",
              "Only the font choice",
              "Only the wifi password",
            ],
            correctIndex: 0,
            explanation: "Written agreements prevent later disputes.",
          },
          {
            prompt: "How many main contacts should each side have?",
            options: [
              "One main point of contact",
              "Too many to count",
              "No contacts at all",
              "Only random viewers",
            ],
            correctIndex: 0,
            explanation: "One contact per side keeps communication clean.",
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
        role: courseData.role,
      },
      create: {
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        icon: courseData.icon,
        order: courseData.order,
        status: "published",
        passingScore: 70,
        role: courseData.role,
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
