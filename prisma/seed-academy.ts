import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Section =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "youtube"; videoUrl: string };

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
  allowedRoles?: string[];
  lessons: SeedLesson[];
};

const courses: SeedCourse[] = [
  {
    title: "Tikfinity",
    slug: "tikfinity",
    description:
      "Learn the full cycle of TikTok LIVE content creation — from going live for the first time to building a community, running battles, and growing as a creator. This course covers everything you need to know to start and sustain a successful TikTok LIVE channel.",
icon: "Video",
    order: 0,
    role: "creator",
    lessons: [
      {
        title: "Before You Go LIVE",
        slug: "before-you-go-live",
        summary:
          "A comprehensive guide to preparing for your first TikTok LIVE — gear, settings, mindset, and a pre-show checklist to ensure a smooth broadcast.",
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
      {
        title: "Check-Ins & Assignments",
        slug: "check-ins-and-assignments",
        summary: "How to run lightweight check-ins and hand out clear work.",
        sections: [
          { type: "heading", text: "Keep check-ins short" },
          {
            type: "paragraph",
            text: "A good check-in answers three things: what shipped, what is blocked, and what is next. Long status meetings waste creator stream time.",
          },
          {
            type: "list",
            items: [
              "Ask for schedule, one win, and one blocker",
              "Write assignments with an owner and a due date",
              "Cancel or shorten check-ins when nothing is blocked",
              "Escalate blockers the creator cannot clear alone",
            ],
          },
          {
            type: "callout",
            text: "If an assignment has no owner and due date, it is not an assignment yet.",
          },
        ],
        questions: [
          {
            prompt: "What should a check-in cover?",
            options: [
              "What shipped, what is blocked, what is next",
              "Only gift totals",
              "Only personal life updates",
              "Nothing — skip check-ins always",
            ],
            correctIndex: 0,
            explanation: "Those three answers keep check-ins useful and short.",
          },
          {
            prompt: "What makes an assignment real?",
            options: [
              "An owner and a due date",
              "A vague idea in chat",
              "A hope for later",
              "No follow-up needed",
            ],
            correctIndex: 0,
            explanation: "Ownership and timing turn intent into execution.",
          },
        ],
      },
      {
        title: "Tracking Creator Progress",
        slug: "tracking-creator-progress",
        summary: "Simple signals that show who is improving and who needs help.",
        sections: [
          { type: "heading", text: "Track trends, not one-offs" },
          {
            type: "paragraph",
            text: "Look at multi-week trends in schedule consistency, chat engagement, and growth — not one lucky stream or one bad night.",
          },
          {
            type: "list",
            items: [
              "Review the same three metrics every week",
              "Compare each creator to their own baseline",
              "Note patterns before making role changes",
              "Share a one-line status with managers when needed",
            ],
          },
          {
            type: "callout",
            text: "Your own baseline is a fairer score than someone else's highlight reel.",
          },
        ],
        questions: [
          {
            prompt: "What is the fairest way to compare a creator?",
            options: [
              "Against their own baseline over time",
              "Against one viral competitor clip",
              "Against last year's drama",
              "Against random chat opinions",
            ],
            correctIndex: 0,
            explanation: "Self-comparison over time is the reliable signal.",
          },
          {
            prompt: "How often should leads review core metrics?",
            options: [
              "Every week, same three metrics",
              "Only when there is a crisis",
              "Once a year",
              "Never",
            ],
            correctIndex: 0,
            explanation: "Consistent weekly review catches drift early.",
          },
        ],
      },
      {
        title: "Team Lead Wrap-Up",
        slug: "team-lead-wrap-up",
        summary: "Your five-lesson loop for leading a creator group.",
        sections: [
          { type: "heading", text: "Run the week" },
          {
            type: "paragraph",
            text: "Own the daily lane, lead people with clear feedback, run short check-ins, and track progress against baselines. That is the full team lead loop.",
          },
          {
            type: "list",
            items: [
              "Schedule and consistency first",
              "One clear goal per creator per week",
              "Assignments with owner and due date",
              "Escalate bigger decisions to managers",
            ],
          },
          {
            type: "callout",
            text: "Pass this knowledge check to earn your Team Lead Operations certificate.",
          },
        ],
        questions: [
          {
            prompt: "What is the team lead loop?",
            options: [
              "Daily lane, feedback, check-ins, progress",
              "Only posting memes",
              "Only arguing in chat",
              "Only changing stream titles",
            ],
            correctIndex: 0,
            explanation: "That loop keeps a creator group healthy.",
          },
          {
            prompt: "Who do you escalate bigger decisions to?",
            options: [
              "Managers",
              "Random viewers",
              "No one ever",
              "Competitors",
            ],
            correctIndex: 0,
            explanation: "Managers own decisions outside the lead's lane.",
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
    allowedRoles: ["manager"],
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
      {
        title: "Motivating Underperformers",
        slug: "motivating-underperformers",
        summary: "Reset momentum when a creator is stuck or drifting.",
        sections: [
          { type: "heading", text: "Diagnose before you push" },
          {
            type: "paragraph",
            text: "Low output usually means a clear blocker: schedule conflict, burnout, unclear goals, or content fatigue. Find the blocker first, then set one small recoverable win.",
          },
          {
            type: "list",
            items: [
              "Ask what changed in their week or schedule",
              "Shrink the next goal until it feels easy",
              "Celebrate the first comeback stream",
              "Recheck in seven days, not three months",
            ],
          },
          {
            type: "callout",
            text: "A small win restarts momentum faster than a long lecture.",
          },
        ],
        questions: [
          {
            prompt: "What should a team lead do first with an underperformer?",
            options: [
              "Find the real blocker",
              "Remove them from the group",
              "Ignore it for a month",
              "Only compare them to top creators",
            ],
            correctIndex: 0,
            explanation: "Blockers explain most dips in performance.",
          },
          {
            prompt: "How large should the recovery goal be?",
            options: [
              "Small and easy to win",
              "Maximum intensity immediately",
              "So big they prove themselves",
              "No goal at all",
            ],
            correctIndex: 0,
            explanation: "Easy wins rebuild confidence and habit.",
          },
        ],
      },
      {
        title: "Running Weekly One-on-Ones",
        slug: "running-weekly-one-on-ones",
        summary: "A repeatable 15-minute structure for every creator check-in.",
        sections: [
          { type: "heading", text: "Same structure every time" },
          {
            type: "paragraph",
            text: "Consistent one-on-ones beat random long chats. Use the same five beats so creators know what to expect and you never leave a meeting without a next step.",
          },
          {
            type: "list",
            items: [
              "Wins since last check-in",
              "Schedule and consistency check",
              "One blocker you can help clear",
              "One goal for the next seven days",
              "Close with the owner and date",
            ],
          },
          {
            type: "callout",
            text: "Fifteen focused minutes weekly beats a two-hour catch-up once a quarter.",
          },
        ],
        questions: [
          {
            prompt: "What must every one-on-one end with?",
            options: [
              "One goal with owner and date",
              "A long unfollowed wishlist",
              "Only small talk",
              "Nothing written down",
            ],
            correctIndex: 0,
            explanation: "A dated goal is what makes the meeting useful.",
          },
          {
            prompt: "How often should one-on-ones run?",
            options: [
              "Weekly on a fixed cadence",
              "Only during crises",
              "Once a year",
              "Never",
            ],
            correctIndex: 0,
            explanation: "Weekly cadence keeps small issues from stacking up.",
          },
        ],
      },
      {
        title: "Managing Creator Teams Wrap-Up",
        slug: "managing-creator-teams-wrap-up",
        summary: "Pull feedback, motivation, and one-on-ones into a weekly system.",
        sections: [
          { type: "heading", text: "Lead the system, not the mood" },
          {
            type: "paragraph",
            text: "Short feedback, blocked-diagnosed motivation, and weekly one-on-ones form a complete team management loop. Run it the same way every week.",
          },
          {
            type: "list",
            items: [
              "One win, one issue, one next step in feedback",
              "Diagnose blockers before pushing harder",
              "Fifteen-minute weekly one-on-ones",
              "Always leave with owner and date",
            ],
          },
          {
            type: "callout",
            text: "Pass this knowledge check to earn your Managing Creator Teams certificate.",
          },
        ],
        questions: [
          {
            prompt: "What is the full management loop for a group?",
            options: [
              "Feedback, motivation, weekly one-on-ones",
              "Only group rants",
              "Only gift comparisons",
              "Only random DMs",
            ],
            correctIndex: 0,
            explanation: "That loop covers performance, people, and process.",
          },
          {
            prompt: "What turns talk into progress?",
            options: [
              "A next step with owner and date",
              "More talking",
              "No follow-up",
              "Public pressure",
            ],
            correctIndex: 0,
            explanation: "Ownership and timing make outcomes real.",
          },
        ],
      },
      {
        title: "Handling Group Conflict",
        slug: "handling-group-conflict",
        summary: "Resolve friction between creators before it poisons the group.",
        sections: [
          { type: "heading", text: "Private first, public never" },
          {
            type: "paragraph",
            text: "Conflict spreads fast in group chats. Move the issue private, hear each side once, agree on one behavioral fix, and restate group norms to everyone without naming people.",
          },
          {
            type: "list",
            items: [
              "Take the thread out of the public group",
              "Ask each person for their view once",
              "Agree one concrete behavior change",
              "Restate norms for the whole group afterward",
            ],
          },
          {
            type: "callout",
            text: "Public callouts create sides. Private fixes keep the team intact.",
          },
        ],
        questions: [
          {
            prompt: "Where should group conflict be handled?",
            options: [
              "Privately with each person",
              "In the public group chat",
              "On social media",
              "By ignoring it",
            ],
            correctIndex: 0,
            explanation: "Private conversations prevent public sides from forming.",
          },
          {
            prompt: "What should conflict resolution produce?",
            options: [
              "One concrete behavior change",
              "A longer argument",
              "A permanent grudge",
              "No follow-up",
            ],
            correctIndex: 0,
            explanation: "A specific change is how resolution becomes real.",
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
      {
        title: "Setting Standards Across Teams",
        slug: "setting-standards-across-teams",
        summary: "Define what good looks like and keep every team aligned.",
        sections: [
          { type: "heading", text: "Standards beat heroics" },
          {
            type: "paragraph",
            text: "When every team invents its own rules, creators get mixed messages. Managers write clear shared standards so leads coach from the same playbook.",
          },
          {
            type: "list",
            items: [
              "Publish one shared expectation sheet for leads and creators",
              "Review standards weekly in lead check-ins",
              "Update standards when a pattern of mistakes appears",
              "Recognize teams that follow the standard cleanly",
            ],
          },
          {
            type: "callout",
            text: "If it is not written down, it is not a standard — it is a rumor.",
          },
        ],
        questions: [
          {
            prompt: "Why write standards down?",
            options: [
              "So every team follows the same playbook",
              "To create extra paperwork",
              "To confuse new leads",
              "Standards are optional",
            ],
            correctIndex: 0,
            explanation: "Written standards remove mixed messages.",
          },
          {
            prompt: "When should standards be reviewed?",
            options: [
              "Weekly with team leads",
              "Once a year only",
              "Never after launch",
              "Only after a public complaint",
            ],
            correctIndex: 0,
            explanation: "Weekly review keeps standards current and used.",
          },
        ],
      },
      {
        title: "Reporting & Decision Making",
        slug: "reporting-and-decision-making",
        summary: "Use clear numbers and calm decisions under pressure.",
        sections: [
          { type: "heading", text: "Decide from signal, not noise" },
          {
            type: "paragraph",
            text: "Managers review schedule consistency, engagement trends, and blockers — then decide one priority. Avoid reacting to every spike or rumor.",
          },
          {
            type: "list",
            items: [
              "Track consistency and engagement, not just gift totals",
              "Separate urgent issues from important ones",
              "Write the decision and the owner in one line",
              "Revisit the decision at the next check-in",
            ],
          },
          {
            type: "callout",
            text: "One clear priority per week beats five vague urgencies.",
          },
        ],
        questions: [
          {
            prompt: "What should managers track first?",
            options: [
              "Consistency and engagement trends",
              "Only gift totals",
              "Competitor gossip",
              "Office snack inventory",
            ],
            correctIndex: 0,
            explanation: "Consistency and engagement are leading signals.",
          },
          {
            prompt: "How should a decision be recorded?",
            options: [
              "With the decision and the owner",
              "Only in someone's memory",
              "As a long ambiguous essay",
              "Not at all",
            ],
            correctIndex: 0,
            explanation: "Clear ownership makes execution reliable.",
          },
        ],
      },
      {
        title: "Manager Wrap-Up",
        slug: "manager-wrap-up",
        summary: "Pull ops, oversight, standards, and decisions together.",
        sections: [
          { type: "heading", text: "Run the system" },
          {
            type: "paragraph",
            text: "Your job is to make work easier for the people doing it: clear priorities, removed blockers, consistent standards, and calm decisions from real signal.",
          },
          {
            type: "list",
            items: [
              "Set one weekly priority for each team",
              "Check leads before micromanaging creators",
              "Keep standards written and reviewed",
              "Document decisions with a named owner",
            ],
          },
          {
            type: "callout",
            text: "Pass this knowledge check to earn your Manager course certificate.",
          },
        ],
        questions: [
          {
            prompt: "What is the manager's core loop?",
            options: [
              "Priorities, blockers, standards, decisions",
              "Only attending meetings",
              "Micromanaging every stream",
              "Avoiding all choices",
            ],
            correctIndex: 0,
            explanation: "That loop keeps the agency moving.",
          },
          {
            prompt: "Who should managers check first?",
            options: [
              "Team leads",
              "Random comment sections",
              "Only the founder",
              "No one",
            ],
            correctIndex: 0,
            explanation: "Leads are the first layer managers support.",
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
      {
        title: "First Contact & Outreach",
        slug: "first-contact-and-outreach",
        summary: "How to open a conversation with a creator without sounding spammy.",
        sections: [
          { type: "heading", text: "Personalize the first message" },
          {
            type: "paragraph",
            text: "A specific note about their stream gets replies. A copy-paste pitch gets ignored or blocked.",
          },
          {
            type: "list",
            items: [
              "Reference one specific stream or moment",
              "Say who you are and what the agency offers",
              "Ask for a short call, not a long commitment",
              "Follow up once, then move on politely",
            ],
          },
          {
            type: "callout",
            text: "One thoughtful message beats fifty identical ones.",
          },
        ],
        questions: [
          {
            prompt: "What makes a first message likely to get a reply?",
            options: [
              "A specific note about their stream",
              "A generic bulk pitch",
              "No introduction at all",
              "Only an emoji",
            ],
            correctIndex: 0,
            explanation: "Personalization shows you actually watched.",
          },
          {
            prompt: "What should the first ask be?",
            options: [
              "A short call",
              "An immediate contract signing",
              "Their account password",
              "A public endorsement",
            ],
            correctIndex: 0,
            explanation: "A low-friction next step keeps the door open.",
          },
        ],
      },
      {
        title: "Tracking the Scout Pipeline",
        slug: "tracking-the-scout-pipeline",
        summary: "Keep prospects moving or close them out cleanly.",
        sections: [
          { type: "heading", text: "No silent stalls" },
          {
            type: "paragraph",
            text: "Every prospect should sit in a clear stage: new, contacted, call booked, signed, or closed. Silence is a process bug, not a strategy.",
          },
          {
            type: "list",
            items: [
              "Update stage after every touch",
              "Set a next-action date on open prospects",
              "Close stale leads with a short note",
              "Share weekly pipeline numbers with your lead",
            ],
          },
          {
            type: "callout",
            text: "A pipeline with dates and stages beats a pile of unread DMs.",
          },
        ],
        questions: [
          {
            prompt: "What should every open prospect have?",
            options: [
              "A stage and a next-action date",
              "Only a username",
              "No notes at all",
              "A permanent maybe",
            ],
            correctIndex: 0,
            explanation: "Stages and dates prevent silent stalls.",
          },
          {
            prompt: "What is a process bug?",
            options: [
              "Prospects sitting with no next step",
              "Signing too many creators",
              "Weekly pipeline reviews",
              "Closing stale leads",
            ],
            correctIndex: 0,
            explanation: "Silence without a next action means the process broke.",
          },
        ],
      },
      {
        title: "Scout Wrap-Up",
        slug: "scout-wrap-up",
        summary: "Your five-lesson loop from spotting talent to a full pipeline.",
        sections: [
          { type: "heading", text: "Find, evaluate, reach, track" },
          {
            type: "paragraph",
            text: "Spot talent past vanity metrics, score it with a simple framework, open personal conversations, and keep the pipeline dated and honest.",
          },
          {
            type: "list",
            items: [
              "Watch several recent streams before scoring",
              "Personalize every first contact",
              "Stage and date every open prospect",
              "Close stale leads cleanly",
            ],
          },
          {
            type: "callout",
            text: "Pass this knowledge check to earn your Creator Discovery & Scouting certificate.",
          },
        ],
        questions: [
          {
            prompt: "What is the scout loop?",
            options: [
              "Spot, evaluate, reach out, track",
              "Only mass DM",
              "Only watch one clip",
              "Only change your own stream",
            ],
            correctIndex: 0,
            explanation: "That sequence fills the agency pipeline.",
          },
          {
            prompt: "How should stale leads be handled?",
            options: [
              "Close them with a short note",
              "Leave them forever",
              "Delete all history",
              "Ignore them silently",
            ],
            correctIndex: 0,
            explanation: "Clean closeout keeps pipeline data trustworthy.",
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
      {
        title: "Follow-Up Cadence",
        slug: "follow-up-cadence",
        summary: "When to nudge, when to wait, and when to close the loop.",
        sections: [
          { type: "heading", text: "Respectful persistence" },
          {
            type: "paragraph",
            text: "Most replies come on the second or third touch — if the touch is useful. Space follow-ups, add new information each time, and stop cleanly when there is no interest.",
          },
          {
            type: "list",
            items: [
              "First follow-up 2–3 days after outreach",
              "Second follow-up with one new useful detail",
              "Third touch is a polite close-the-loop note",
              "Never spam daily or guilt-trip a no",
            ],
          },
          {
            type: "callout",
            text: "A clean close leaves the door open for later. Harassment does not.",
          },
        ],
        questions: [
          {
            prompt: "When is a good first follow-up window?",
            options: [
              "2–3 days after outreach",
              "Two hours later",
              "Six months later",
              "Never follow up",
            ],
            correctIndex: 0,
            explanation: "A short window stays warm without being pushy.",
          },
          {
            prompt: "What should each follow-up include?",
            options: [
              "One new useful detail",
              "The exact same message again",
              "Pressure or guilt",
              "Nothing new",
            ],
            correctIndex: 0,
            explanation: "New value gives the creator a reason to reply.",
          },
        ],
      },
      {
        title: "Recording Calls & Next Steps",
        slug: "recording-calls-and-next-steps",
        summary: "Turn conversations into written notes the team can trust.",
        sections: [
          { type: "heading", text: "If it is not written, it did not happen" },
          {
            type: "paragraph",
            text: "After every call, write a short note: who, outcome, objections, agreed next step, and date. Your future self and your lead will both need it.",
          },
          {
            type: "list",
            items: [
              "Log date, participants, and outcome",
              "Capture objections in the creator's words",
              "Write the exact next step and owner",
              "Share the note in the scout channel same day",
            ],
          },
          {
            type: "callout",
            text: "Good notes prevent double-contact and lost deals.",
          },
        ],
        questions: [
          {
            prompt: "When should call notes be written?",
            options: [
              "Same day, while memory is fresh",
              "Weeks later",
              "Only if the deal closes",
              "Never",
            ],
            correctIndex: 0,
            explanation: "Same-day notes are accurate and actionable.",
          },
          {
            prompt: "What must every call note include?",
            options: [
              "Outcome and exact next step with owner",
              "Only weather talk",
              "Only follower counts",
              "Nothing actionable",
            ],
            correctIndex: 0,
            explanation: "Outcome plus ownership is what the team can act on.",
          },
        ],
      },
      {
        title: "Scouting Outreach & Tracking Wrap-Up",
        slug: "scouting-outreach-tracking-wrap-up",
        summary: "Your five-lesson path from first message to a clean record.",
        sections: [
          { type: "heading", text: "Outreach that stays organized" },
          {
            type: "paragraph",
            text: "Personal first messages, respectful follow-ups, a staged pipeline, and same-day notes form a complete outreach system. Run it every week.",
          },
          {
            type: "list",
            items: [
              "Personalize every first contact",
              "Follow up on a 2–3 day cadence",
              "Stage and date every open prospect",
              "Write call notes the same day",
            ],
          },
          {
            type: "callout",
            text: "Pass this knowledge check to earn your Scouting Outreach & Tracking certificate.",
          },
        ],
        questions: [
          {
            prompt: "What is the outreach system loop?",
            options: [
              "Message, follow up, track, record",
              "Only mass DMs",
              "Only cold calls with no notes",
              "Only hope",
            ],
            correctIndex: 0,
            explanation: "That sequence keeps outreach effective and auditable.",
          },
          {
            prompt: "How should a polite close work?",
            options: [
              "Leave the door open for later",
              "Burn the bridge forever",
              "Spam until they block you",
              "Skip all documentation",
            ],
            correctIndex: 0,
            explanation: "A clean close protects future opportunities.",
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
            prompt: "What makes cross-agency prep easier?",
            options: [
              "One main point of contact per side",
              "Everyone talking to everyone",
              "No written notes at all",
              "Last-minute changes only",
            ],
            correctIndex: 0,
            explanation: "A single contact per side keeps communication clean.",
          },
        ],
      },
      {
        title: "Pre-Battle Run of Show",
        slug: "pre-battle-run-of-show",
        summary: "A timed checklist so nothing is forgotten before GO LIVE.",
        sections: [
          { type: "heading", text: "Run of show" },
          {
            type: "paragraph",
            text: "A run of show is a simple timeline: who confirms what, and when. Coordinators who use one avoid last-minute scrambles.",
          },
          {
            type: "list",
            items: [
              "T-24h: confirm creators, format, and slot in writing",
              "T-1h: reconfirm both sides and announce to chat",
              "T-10m: both creators ready, points of contact online",
              "T-0: start on time; log the official result after",
            ],
          },
          {
            type: "callout",
            text: "If it is not on the run of show, it will be forgotten under pressure.",
          },
        ],
        questions: [
          {
            prompt: "What is a run of show?",
            options: [
              "A timed checklist of who confirms what",
              "A gift leaderboard",
              "A font style guide",
              "A follower ranking",
            ],
            correctIndex: 0,
            explanation: "It is a timeline that prevents last-minute chaos.",
          },
          {
            prompt: "When should both sides reconfirm?",
            options: [
              "About one hour before start",
              "Only after the battle",
              "Never",
              "Only if someone complains",
            ],
            correctIndex: 0,
            explanation: "A T-1h reconfirm catches no-shows early.",
          },
        ],
      },
      {
        title: "Live Event Communication",
        slug: "live-event-communication",
        summary: "Keep creators, leads, and chat informed without noise.",
        sections: [
          { type: "heading", text: "One channel, clear updates" },
          {
            type: "paragraph",
            text: "During the battle, over-communication creates confusion. Use one private channel for staff and keep public chat updates short and factual.",
          },
          {
            type: "list",
            items: [
              "One staff channel for internal decisions",
              "Short public updates: start time, format, result",
              "Do not leak private contact info in public chat",
              "Have a backup contact if the main one drops",
            ],
          },
          {
            type: "callout",
            text: "Public chat gets facts; staff channel gets problems.",
          },
        ],
        questions: [
          {
            prompt: "Where should internal problems be discussed?",
            options: [
              "A private staff channel",
              "Public battle chat only",
              "Random DMs with fans",
              "Nowhere",
            ],
            correctIndex: 0,
            explanation: "Internal issues stay private to the team.",
          },
          {
            prompt: "What should public updates include?",
            options: [
              "Start time, format, and result",
              "Every private disagreement",
              "Personal phone numbers",
              "Unconfirmed rumors",
            ],
            correctIndex: 0,
            explanation: "Short factual updates keep chat informed.",
          },
        ],
      },
      {
        title: "Scoring Disputes & Closeout",
        slug: "scoring-disputes-and-closeout",
        summary: "Resolve score questions cleanly and file the result.",
        sections: [
          { type: "heading", text: "Close clean" },
          {
            type: "paragraph",
            text: "If scores are disputed, pause, restate the written rules, and resolve through points of contact — not public arguments. Then file the official result.",
          },
          {
            type: "list",
            items: [
              "Return to the original written agreement",
              "Keep public posts factual",
              "Record winner, format, and date",
              "Share the result with both agencies",
            ],
          },
          {
            type: "callout",
            text: "Clean closeout is how you get invited back for bigger matchups.",
          },
        ],
        questions: [
          {
            prompt: "First step in a scoring dispute?",
            options: [
              "Restate the original written rules",
              "Start a public argument",
              "Delete the stream",
              "Ignore both sides",
            ],
            correctIndex: 0,
            explanation: "The written agreement is the source of truth.",
          },
          {
            prompt: "What belongs in the official result?",
            options: [
              "Winner, format, and date",
              "Only emojis",
              "Fan private messages",
              "Nothing",
            ],
            correctIndex: 0,
            explanation: "A complete result prevents later confusion.",
          },
        ],
      },
      {
        title: "Coordinator Wrap-Up",
        slug: "coordinator-wrap-up",
        summary: "Full battle flow from setup to recorded result.",
        sections: [
          { type: "heading", text: "Own the full flow" },
          {
            type: "paragraph",
            text: "You now know setup, run of show, live communication, disputes, and closeout. A coordinator who follows the full flow makes battles easy to run and hard to dispute.",
          },
          {
            type: "list",
            items: [
              "Confirm early and reconfirm at T-1h",
              "Use one staff channel and short public updates",
              "Resolve disputes from the written agreement",
              "File and share the official result",
            ],
          },
          {
            type: "callout",
            text: "Pass this knowledge check to earn your Battle Coordinator certificate.",
          },
        ],
        questions: [
          {
            prompt: "What is the full coordinator flow?",
            options: [
              "Setup → run of show → live comms → closeout",
              "Only picking a stream title",
              "Only gift totals",
              "Only posting after the battle",
            ],
            correctIndex: 0,
            explanation: "That sequence covers the whole battle lifecycle.",
          },
          {
            prompt: "What makes battles easy to trust?",
            options: [
              "Clean closeout and shared results",
              "Public arguments",
              "No written rules",
              "Last-minute changes only",
            ],
            correctIndex: 0,
            explanation: "Trust comes from clear process and records.",
          },
        ],
      },
    ],
  },
  // ── Merged: Managing Creator Teams + Agency Management Basics ──
  // For battle_coordinator, team_lead, manager, and scout
  {
    title: "Managing Creator Teams & Agency Operations",
    slug: "managing-creator-teams-agency-ops",
    description:
      "Combined playbook for leading creator teams and running agency operations — for team leads, managers, battle coordinators, and scouts.",
    icon: "Users",
    order: 9,
    role: "team_lead",
    allowedRoles: ["manager", "battle_coordinator", "scout"],
    lessons: [
      {
        title: "Leadership Mindset Across Roles",
        slug: "leadership-mindset-across-roles",
        summary: "How team leads, managers, coordinators, and scouts each lead differently.",
        sections: [
          { type: "heading", text: "Every role is a leadership role" },
          {
            type: "paragraph",
            text: "Whether you are directly managing creators or coordinating events or scouting talent, you are setting the tone. The difference is scope: team leads coach individuals, managers run operations, coordinators run events, scouts find the next wave.",
          },
          {
            type: "list",
            items: [
              "Team leads: feedback, motivation, and weekly goals for creators",
              "Managers: priorities, blockers, and standards across teams",
              "Battle coordinators: timing, format, and clean event closeout",
              "Scouts: spotting talent and running a clean outreach pipeline",
            ],
          },
          {
            type: "callout",
            text: "The best agencies run on leaders at every level, not just at the top.",
          },
        ],
        questions: [
          {
            prompt: "What is the common thread across all four roles?",
            options: [
              "Leadership and clear communication",
              "Only tracking metrics",
              "Only attending meetings",
              "Avoiding decisions",
            ],
            correctIndex: 0,
            explanation: "Every role leads in some way.",
          },
          {
            prompt: "Who is responsible for weekly creator goals?",
            options: [
              "Team leads",
              "Only the founder",
              "Only the audience",
              "No one",
            ],
            correctIndex: 0,
            explanation: "Team leads set and follow up on creator goals.",
          },
        ],
      },
      {
        title: "Running Creator Operations Day to Day",
        slug: "running-creator-ops-day-to-day",
        summary: "The operational habits that keep an agency moving.",
        sections: [
          { type: "heading", text: "Keep the machine running" },
          {
            type: "paragraph",
            text: "Good operations are invisible when they work. Priorities are clear, blockers are removed early, and everyone knows what good looks like. When operations slip, creators and staff both feel it.",
          },
          {
            type: "list",
            items: [
              "Set weekly priorities for teams and creators",
              "Check that team leads have what they need",
              "Remove blockers before they stall a creator",
              "Keep standards consistent across teams",
            ],
          },
          {
            type: "callout",
            text: "A manager's job is to make the work easier for the people doing it.",
          },
        ],
        questions: [
          {
            prompt: "What is the first thing to check when a creator stalls?",
            options: [
              "Whether there is a blocker you can remove",
              "Whether to replace the creator",
              "Whether to ignore it",
              "Whether to blame the team lead",
            ],
            correctIndex: 0,
            explanation: "Early blocker removal keeps momentum.",
          },
          {
            prompt: "What keeps standards consistent across teams?",
            options: [
              "Clear shared priorities",
              "Every team inventing its own rules",
              "No written expectations",
              "Only verbal instructions",
            ],
            correctIndex: 0,
            explanation: "Shared priorities keep teams aligned.",
          },
        ],
      },
      {
        title: "Giving Feedback That Creators Use",
        slug: "feedback-that-creators-use",
        summary: "Short, specific, repeatable feedback that changes behavior.",
        sections: [
          { type: "heading", text: "Make feedback usable" },
          {
            type: "paragraph",
            text: "Creators improve fastest when feedback is concrete: one win, one issue tied to a specific moment, and one next step they can repeat. Long reviews get ignored.",
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
        ],
      },
      {
        title: "Coordinating Battles and Events",
        slug: "coordinating-battles-and-events",
        summary: "Run clean LIVE events that both agencies trust.",
        sections: [
          { type: "heading", text: "Make the shared parts explicit" },
          {
            type: "paragraph",
            text: "Battle coordinators own the full flow: pre-battle setup, live event communication, and post-battle closure. The goal is a battle that is easy to run and hard to dispute.",
          },
          {
            type: "list",
            items: [
              "Confirm both creators and their teams ahead of time",
              "Agree on format, timing, and any stakes upfront",
              "Keep communication clear and documented during the event",
              "Record the result cleanly after the battle",
            ],
          },
          {
            type: "callout",
            text: "A good coordinator makes the battle easy to run and hard to dispute.",
          },
        ],
        questions: [
          {
            prompt: "What must be agreed before a battle starts?",
            options: [
              "Timing, format, and expectations",
              "Only the winner's payout",
              "Nothing at all",
              "Only the stream title",
            ],
            correctIndex: 0,
            explanation: "Clear pre-agreement prevents disputes.",
          },
          {
            prompt: "What happens after a battle?",
            options: [
              "Record the result cleanly",
              "Delete everything immediately",
              "Argue in public chat",
              "Ignore both sides",
            ],
            correctIndex: 0,
            explanation: "Clean closure builds trust for future battles.",
          },
        ],
      },
      {
        title: "Spotting and Developing Talent",
        slug: "spotting-and-developing-talent",
        summary: "How to find creators and help them grow once they are in.",
        sections: [
          { type: "heading", text: "Evaluate the whole creator" },
          {
            type: "paragraph",
            text: "A big follower count is not enough. Good scouts and team leads look at engagement, consistency, personality, and fit with the agency. Once a creator is in, the same attention helps them grow.",
          },
          {
            type: "list",
            items: [
              "Watch several recent streams, not just one viral clip",
              "Notice how the creator talks with chat",
              "Check consistency of schedule and energy",
              "Once they join, give one clear goal per week",
            ],
          },
          {
            type: "callout",
            text: "Good leaders evaluate the whole creator and then help them improve.",
          },
        ],
        questions: [
          {
            prompt: "What matters most when evaluating a creator?",
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
            prompt: "What should a leader give a new creator each week?",
            options: [
              "One clear goal",
              "Fifty competing goals",
              "No goals at all",
              "Goals only for top creators",
            ],
            correctIndex: 0,
            explanation: "One clear goal is easier to track and achieve.",
          },
        ],
      },
    ],
  },
  // ── Merged: Creator Discovery & Scouting + Scouting Outreach & Tracking ──
  // For scouts
  {
    title: "Creator Discovery, Scouting & Outreach",
    slug: "creator-discovery-scouting-outreach",
    description:
      "Combined playbook for scouts: spotting talent, evaluating it, reaching out, and tracking the pipeline.",
    icon: "Search",
    order: 10,
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
        ],
      },
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
        ],
      },
      {
        title: "Tracking the Scout Pipeline",
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
        ],
      },
      {
        title: "From Prospect to Signed Creator",
        slug: "from-prospect-to-signed-creator",
        summary: "Close the loop when a scouted creator joins the agency.",
        sections: [
          { type: "heading", text: "A smooth handoff" },
          {
            type: "paragraph",
            text: "When a prospect becomes a signed creator, the scout's job is not done. A clean handoff to the team lead or manager sets the new creator up for success and keeps the agency's standards consistent.",
          },
          {
            type: "list",
            items: [
              "Share what you learned about the creator's strengths",
              "Note any concerns or watch points for the team lead",
              "Introduce the creator to their new team lead",
              "Keep the pipeline updated so the prospect is not double-contacted",
            ],
          },
          {
            type: "callout",
            text: "A good handoff turns a signed creator into a growing creator faster.",
          },
        ],
        questions: [
          {
            prompt: "What should a scout share in a handoff?",
            options: [
              "What they learned about the creator's strengths",
              "Nothing, let the team lead start from zero",
              "Only the creator's follower count",
              "Only the first message sent",
            ],
            correctIndex: 0,
            explanation: "Context from the scout accelerates the new creator's growth.",
          },
          {
            prompt: "Why update the pipeline after a sign?",
            options: [
              "To avoid double-contacting the same prospect",
              "To make the spreadsheet bigger",
              "To confuse the team lead",
              "There is no reason to update it",
            ],
            correctIndex: 0,
            explanation: "An updated pipeline keeps everyone honest and organized.",
          },
        ],
      },
    ],
  },
  {
    title: "YouTube Content Mastery",
    slug: "youtube-content-mastery",
    description:
      "Learn how to create, grow, and monetize YouTube content — from filming your first video to building a loyal audience.",
    icon: "Video",
    order: 11,
    role: "creator",
    lessons: [
      {
        title: "Creating Your First YouTube Video",
        slug: "creating-your-first-youtube-video",
        summary:
          "Plan, film, edit, and publish your first YouTube video with confidence.",
        sections: [
          {
            type: "heading",
            text: "Plan Your Video",
          },
          {
            type: "paragraph",
            text: "Before you touch the camera, define your video's purpose, target audience, and key message. A well-planned video gets 3x more views than a spontaneous one.",
          },
          {
            type: "list",
            items: [
              "Choose a topic your audience actually searches for",
              "Write a simple script or bullet-point outline",
              "Set up lighting and clear audio before filming",
              "Keep the first 10 seconds compelling to reduce drop-off",
            ],
          },
          {
            type: "youtube",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
          {
            type: "paragraph",
            text: "After filming, edit for pacing — cut dead air, add transitions, and end with a clear call to action. Upload with an optimized title, description, and tags.",
          },
          {
            type: "callout",
            text: "Consistency beats perfection. Upload regularly and improve with each video.",
          },
        ],
        questions: [
          {
            prompt: "What should you do before filming a YouTube video?",
            
            options: [
              "Define the purpose and audience",
              "Film immediately for authenticity",
              "Only worry about lighting",
              "Skip the script entirely",
            ],
            correctIndex: 0,
            explanation: "Planning your video's purpose and audience ensures you deliver value and keep viewers engaged.",
          },
          {
            prompt: "What is the most important part of the first 10 seconds?",
            
            options: [
              "Show your face clearly",
              "Hook the viewer with a compelling message",
              "Play background music",
              "List all your social media handles",
            ],
            correctIndex: 1,
            explanation: "The first 10 seconds determine whether viewers stay or click away. A strong hook reduces drop-off.",
          },
          {
            prompt: "What should you do after filming?",
            
            options: [
              "Upload immediately without editing",
              "Edit for pacing and add a call to action",
              "Delete the video and start over",
              "Only change the thumbnail",
            ],
            correctIndex: 1,
            explanation: "Editing for pacing and ending with a clear call to action significantly boosts engagement and retention.",
          },
        ],
      },
      {
        title: "Growing Your YouTube Channel",
        slug: "growing-your-youtube-channel",
        summary:
          "Strategies for building a loyal audience and increasing watch time on YouTube.",
        sections: [
          {
            type: "heading",
            text: "Know Your Audience",
          },
          {
            type: "paragraph",
            text: "Use YouTube Analytics to understand who watches your videos, when they watch, and what they search for. Tailor your content to match their interests.",
          },
          {
            type: "youtube",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
          {
            type: "list",
            items: [
              "Post consistently on a schedule your audience expects",
              "Use searchable titles, descriptions, and tags",
              "Collaborate with other creators in your niche",
              "Respond to comments to build community",
              "Analyze your top videos and create more like them",
            ],
          },
          {
            type: "callout",
            text: "Growth is a marathon, not a sprint. Focus on value and consistency over chasing viral moments.",
          },
        ],
        questions: [
          {
            prompt: "How can you understand your YouTube audience better?",
            
            options: [
              "Guess based on your gut feeling",
              "Use YouTube Analytics to see viewer demographics and behavior",
              "Ask friends who you think might watch",
              "Only look at subscriber count",
            ],
            correctIndex: 1,
            explanation: "YouTube Analytics provides detailed insights into viewer demographics, watch time, and traffic sources.",
          },
          {
            prompt: "Which strategy is most effective for growing a YouTube channel?",
            
            options: [
              "Post as many videos as possible every day",
              "Buy subscribers and views",
              "Post consistently on a schedule and analyze top-performing content",
              "Only use clickbait thumbnails",
            ],
            correctIndex: 2,
            explanation: "Consistent posting on a schedule combined with analyzing what works creates sustainable growth.",
          },
        ],
      },
    ],
  },
  {
    title: "Tikfinity",
    slug: "tikfinity",
    description:
      "Master TikTok LIVE growth with proven strategies — from first stream to sustainable creator business. Covers setup, engagement, battles, monetization, and long-term growth systems.",
icon: "Video",
    order: 11,
    role: "creator",
    lessons: [
      {
        title: "First Stream Setup",
        slug: "first-stream-setup",
        summary:
          "Complete pre-flight checklist — lighting, audio, internet, and mindset for a confident first LIVE.",
        sections: [
          {
            type: "heading",
            text: "Your First Stream Checklist",
          },
          {
            type: "paragraph",
            text: "Preparation separates smooth first streams from technical disasters. Run this checklist 30 minutes before every broadcast.",
          },
          {
            type: "youtube",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
          {
            type: "list",
            items: [
              "Soft key light at 45° — no backlighting from windows",
              "External mic or wired earbuds; test audio levels",
              "Wi-Fi 5GHz or strong cellular; close background apps",
              "Pin welcome message + 3 conversation starters",
              "Hydration, charger, and \"do not disturb\" sign on door",
            ],
          },
          {
            type: "callout",
            text: "A consistent weekly schedule trains your audience more than any single viral stream.",
          },
        ],
        questions: [
          {
            prompt: "What is the ideal key-light position for a first stream?",
            
            options: [
              "Directly overhead",
              "45° angle, slightly above eye level",
              "Behind you facing the wall",
              "On the floor pointing up",
            ],
            correctIndex: 1,
            explanation: "45° key light gives dimensional, flattering illumination without harsh shadows.",
            
          },
          {
            prompt: "Why close background apps before going LIVE?",
            
            options: [
              "To save battery",
              "To free bandwidth and CPU for stable streaming",
              "To hide notifications",
              "To make the phone faster for games",
            ],
            correctIndex: 1,
            explanation: "Background apps consume bandwidth and CPU, causing dropped frames and lag.",
            
          },
          {
            prompt: "What should you pin before going live?",
            
            options: [
              "Your bio",
              "Welcome message with schedule and CTA",
              "A random emoji",
              "The current time",
            ],
            correctIndex: 1,
            explanation: "A pinned welcome message orients new viewers and drives follows.",
            
          },
          {
            prompt: "How far should your key light be from your face for soft illumination?",
            
            options: [
              "Right against the skin",
              "About 3–4 feet",
              "As far as the room allows",
              "Behind the camera only",
            ],
            correctIndex: 1,
            explanation: "3–4 feet creates soft, wrap-around light without hot spots.",
            
          },
        ],
      },
      {
        title: "Engagement & Retention",
        slug: "engagement-retention",
        summary:
          "Turn passive viewers into active community — greetings, questions, polls, and shoutout systems that keep chat moving.",
        sections: [
          {
            type: "heading",
            text: "Two-Way Energy",
          },
          {
            type: "paragraph",
            text: "LIVE is a conversation, not a broadcast. The algorithm and viewers both reward streams where people feel heard.",
          },
          {
            type: "youtube",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
          {
            type: "list",
            items: [
              "Greet every new name out loud within 5 seconds",
              "Ask low-friction questions: yes/no, this-or-that, number polls",
              "Repeat good questions so lurkers can follow",
              "Shout out every gift by name + gift name",
              "Pin a \"topic of the day\" and reference it repeatedly",
            ],
          },
          {
            type: "callout",
            text: "Dead air loses viewers faster than bad content. Narrate what you are doing if you need a beat.",
          },
        ],
        questions: [
          {
            prompt: "Which question type generates the most replies on LIVE?",
            
            options: [
              "Open essays",
              "Yes/no and this-or-that",
              "Questions requiring a login",
              "No questions at all",
            ],
            correctIndex: 1,
            explanation: "Low-friction binary choices maximize reply rate and keep chat scrolling.",
            
          },
          {
            prompt: "How should you acknowledge a gift?",
            
            options: [
              "Generic \"thanks everyone\"",
              "Name the person + gift name",
              "Wait until stream end",
              "Only thank top 3 gifters",
            ],
            correctIndex: 1,
            explanation: "Specific shoutouts make supporters feel seen and encourage others.",
            
          },
          {
            prompt: "What is a good \"topic of the day\" technique?",
            
            options: [
              "Change it every 2 minutes",
              "Pin one theme and reference it throughout the stream",
              "Let chat vote on 5 topics at once",
              "Never use topics",
            ],
            correctIndex: 1,
            explanation: "A single pinned theme gives new viewers instant context.",
            
          },
          {
            prompt: "How should you handle a controversial comment?",
            
            options: [
              "Argue publicly to show dominance",
              "Ignore / mute / ban if needed, then refocus",
              "Ban instantly without warning",
              "End the stream immediately",
            ],
            correctIndex: 1,
            explanation: "De-escalate fast; moderate if needed, then steer back to positive energy.",
            
          },
        ],
      },
      {
        title: "Battles & Monetization",
        slug: "battles-monetization",
        summary:
          "Win battles ethically, maximize gift revenue, and convert battle viewers into long-term supporters.",
        sections: [
          {
            type: "heading",
            text: "Battle Mechanics & Ethics",
          },
          {
            type: "paragraph",
            text: "Battles convert viewer energy into points and revenue. Understand the invite flow, round timer, and battle-eligible gifts before you accept a match.",
          },
          {
            type: "youtube",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
          {
            type: "list",
            items: [
              "Learn the invite flow and round timer in your app version",
              "Explain to chat how they can support during the battle",
              "Celebrate effort in wins and losses — attitude is content",
              "Never pressure or guilt viewers for gifts",
              "Post-battle: thank opponents, clip highlights, funnel new viewers to follow",
            ],
          },
          {
            type: "callout",
            text: "Pressure burns trust. Gratitude without guilt builds a community that sustains you.",
          },
        ],
        questions: [
          {
            prompt: "What determines the winner of a TikTok LIVE battle?",
            
            options: [
              "Follower count",
              "Battle points from eligible gifts",
              "Who talks the most",
              "Verification status",
            ],
            correctIndex: 1,
            explanation: "Only battle-eligible gifts shown in the battle UI convert to points.",
            
          },
          {
            prompt: "How should you handle a loss?",
            
            options: [
              "Blame chat for not gifting enough",
              "Congratulate the winner and thank your supporters",
              "Delete the replay and pretend it never happened",
              "Demand a rematch immediately",
            ],
            correctIndex: 1,
            explanation: "Grace in defeat builds long-term respect and community loyalty.",
            
          },
          {
            prompt: "Which gifts count toward battle points?",
            
            options: [
              "All gifts",
              "Only battle-eligible gifts shown in the battle UI",
              "Only diamonds",
              "Only gifts over 100 coins",
            ],
            correctIndex: 1,
            explanation: "Only gifts marked as battle-eligible in the battle UI convert to points.",
            
          },
          {
            prompt: "What is the healthiest mindset toward gifting?",
            
            options: [
              "Expect gifts every stream",
              "Gratitude without pressure; gifts are bonus, not requirement",
              "Only stream when gifts are guaranteed",
              "Guilt viewers who do not gift",
            ],
            correctIndex: 1,
            explanation: "Gratitude without obligation creates sustainable support.",
            
          },
        ],
      },
      {
        title: "Safety, Compliance & Brand Safety",
        slug: "safety-compliance-brand-safety",
        summary:
          "Protect your account, follow TikTok guidelines, and build a brand-safe stream that attracts partnerships.",
        sections: [
          {
            type: "heading",
            text: "Protect Your Asset",
          },
          {
            type: "paragraph",
            text: "One policy strike can freeze earnings or ban LIVE access. Know the lines before you cross them.",
          },
          {
            type: "youtube",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
          {
            type: "list",
            items: [
              "Zero tolerance: hate speech, harassment, sexual content, self-harm",
              "No misleading medical, financial, or legal claims without credentials",
              "Never show addresses, phone numbers, or private documents on screen",
              "Report brigading/scam comments — do not engage",
              "Use slow mode, keyword filters, and trusted mods for hostile chat",
            ],
          },
          {
            type: "callout",
            text: "Brand-safe streams attract agency deals and TikTok program invitations.",
          },
        ],
        questions: [
          {
            prompt: "What should you never show on screen?",
            
            options: [
              "Your streaming setup",
              "Personal addresses or private documents",
              "Chat usernames in a shoutout",
              "On-screen timers",
            ],
            correctIndex: 1,
            explanation: "Doxxing yourself or others violates safety policy and endangers you.",
            
          },
          {
            prompt: "Can you give unlicensed financial advice on LIVE?",
            
            options: [
              "Yes, if you have followers",
              "No — financial/medical/legal advice requires proper licensing",
              "Only with a disclaimer",
              "Only in private messages",
            ],
            correctIndex: 1,
            explanation: "Unlicensed financial, medical, or legal claims violate TikTok policy and local law.",
            
          },
          {
            prompt: "How should you handle a coordinated harassment raid?",
            
            options: [
              "Argue with each person",
              "Enable slow mode, use keyword filters, empower mods, report to TikTok",
              "Turn off chat completely",
              "End the stream and quit",
            ],
            correctIndex: 1,
            explanation: "Tools + moderation + reporting = effective defense.",
            
          },
          {
            prompt: "Why does brand safety matter for monetization?",
            
            options: [
              "It does not",
              "Brands and TikTok programs prefer policy-compliant creators",
              "Only for verified creators",
              "Only for battles",
            ],
            correctIndex: 1,
            explanation: "Clean records unlock TikTok programs, agency deals, and brand partnerships.",
            
          },
        ],
      },
      {
        title: "Growth Systems & Long-Term Business",
        slug: "growth-systems-long-term-business",
        summary:
          "Build a repeatable system — calendar, analytics, clips, collaborations — that turns one good stream into a sustainable creator business.",
        sections: [
          {
            type: "heading",
            text: "Build the System",
          },
          {
            type: "paragraph",
            text: "Viral moments fade. Systems compound. After every stream: note what spiked, what flopped, and one experiment for next time.",
          },
          {
            type: "youtube",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
          {
            type: "list",
            items: [
              "Fixed weekly LIVE calendar (same days/times)",
              "Clip 2–3 highlights per stream for Reels/TikTok/Shorts",
              "Track: avg viewers, watch time, new follows, gift revenue",
              "Monthly collab with a peer for cross-pollination",
              "Quarterly review: double down on top 20% of content types",
            ],
          },
          {
            type: "callout",
            text: "Small consistent improvements beat chasing viral lottery tickets.",
          },
        ],
        questions: [
          {
            prompt: "What is the most effective post-stream habit?",
            
            options: [
              "Check only gift total",
              "Note what spiked, what flopped, and one experiment for next time",
              "Nothing — instinct is enough",
              "Delete the replay",
            ],
            correctIndex: 1,
            explanation: "Structured reflection with one experiment drives compounding improvement.",
            
          },
          {
            prompt: "How many short-form clips should you create per stream?",
            
            options: [
              "Zero",
              "2–3 high-quality clips",
              "50+ clips",
              "Only the full stream",
            ],
            correctIndex: 1,
            explanation: "2–3 focused clips outperform flooding feeds with low-effort cuts.",
            
          },
          {
            prompt: "Which metric signals sustainable growth?",
            
            options: [
              "One viral stream",
              "Consistent weekly calendar + steady metric improvement",
              "Buying followers",
              "Changing your name monthly",
            ],
            correctIndex: 1,
            explanation: "Consistency and iteration compound; viral spikes do not.",
            
          },
          {
            prompt: "What is the purpose of a quarterly content review?",
            
            options: [
              "To waste time",
              "Double down on the top 20% of content types that perform",
              "To delete old videos",
              "To change your niche every quarter",
            ],
            correctIndex: 1,
            explanation: "Pareto analysis focuses effort on what actually works.",
            
          },
        ],
      },
    ],
  },
];

const roleCourses: SeedCourse[] = [];

const allCourses: SeedCourse[] = [...courses, ...roleCourses];

async function main() {
  const dbHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL || "").host || "unknown";
    } catch {
      return "invalid-url";
    }
  })();
  console.log(`seed-academy start: courses=${allCourses.length} host=${dbHost}`);

  for (const courseData of allCourses) {
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
            
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation || null,
            order: qi,
          })),
        });
      }
    }

    console.log(`Seeded course: ${courseData.title} (${courseData.slug}, ${courseData.lessons.length} lessons)`);
  }

  const totalCourses = await prisma.course.count();
  const teamLeadOps = await prisma.lesson.count({
    where: { course: { slug: "team-lead-ops" } },
  });
  console.log(
    `seed-academy done: dbCourses=${totalCourses} teamLeadOpsLessons=${teamLeadOps}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

