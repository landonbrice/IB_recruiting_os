export interface CoachAction {
  key: string;
  label: string;
  prompt: string;
  iconPath?: string;
  terminalCmd?: string;
}

export const CORE_COACH_ACTIONS: CoachAction[] = [
  {
    key: "score",
    label: "Score Resume",
    prompt: "Score my resume",
    iconPath:
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    terminalCmd: ":score",
  },
  {
    key: "verbs",
    label: "Weak Verb Scan",
    prompt: "Scan my resume for weak verbs and suggest replacements",
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    terminalCmd: ":verbs",
  },
  {
    key: "story",
    label: "Develop Story",
    prompt: "Let's develop my Why-IB story — ask me one question at a time",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    terminalCmd: ":story",
  },
  {
    key: "cover",
    label: "Cover Letter",
    prompt: "Generate a cover letter based on everything we've discussed",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    terminalCmd: ":cover",
  },
  {
    key: "network",
    label: "Networking Plan",
    prompt:
      "Give me a concrete networking action plan for this week — specific steps, not general advice",
    iconPath:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    terminalCmd: ":network",
  },
];

export const CHAT_QUICK_PROMPTS = [
  CORE_COACH_ACTIONS[0].prompt,
  "Rewrite my weakest bullet",
  "Help me tighten my Why IB story",
  CORE_COACH_ACTIONS[4].prompt,
];
