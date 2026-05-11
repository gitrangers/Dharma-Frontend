/** Mirrors `frontend/js/rapidAnswer.js` — same 10 Rapid Fire questions. */

export type FanOption = {
  id: string;
  name: string;
  answer?: true;
  selected?: boolean;
};

export type FanQuestion = {
  id: number;
  quesNo: string;
  question: string;
  model: string;
  options: FanOption[];
};

export const FAN_RAPID_TOTAL_SECONDS = 90;

/** Deep clone so mutations (selected flags) don't touch originals */
export function cloneQuestions(): FanQuestion[] {
  return FAN_RAPID_QUESTIONS.map((q) => ({
    ...q,
    options: q.options.map((o) => ({ ...o })),
  }));
}

export function computeFanScore(answered: FanQuestion[]): number {
  let score = 0;
  for (const q of answered) {
    for (const o of q.options) {
      if (o.selected && o.answer) score++;
    }
  }
  return score;
}

const FAN_RAPID_QUESTIONS: FanQuestion[] = [
  {
    id: 1,
    quesNo: "Q1",
    question: "Which court do Rahul & Anjali always settle their scores in?",
    model: "quest1",
    options: [
      { id: "radio1", name: "Basketball", answer: true },
      { id: "radio2", name: "Tennis" },
    ],
  },
  {
    id: 2,
    quesNo: "Q2",
    question: "What's the plan that Aman hatches for Rohit to impress Naina?",
    model: "quest2",
    options: [
      { id: "radio1", name: "One two ka four " },
      { id: "radio2", name: "6 din ladki in ", answer: true },
    ],
  },
  {
    id: 3,
    quesNo: "Q3",
    question: "Whose plan was it to move-in with Neha by pretending to be a gay couple?",
    model: "quest3",
    options: [
      { id: "radio1", name: "Sam", answer: true },
      { id: "radio2", name: "Kunal" },
    ],
  },
  {
    id: 4,
    quesNo: "Q4",
    question: "Where do Abhi and Rohan clash for the first time in St. Teresa?",
    model: "quest4",
    options: [
      { id: "radio1", name: "Parking", answer: true },
      { id: "radio2", name: "Track and field" },
    ],
  },
  {
    id: 5,
    quesNo: "Q5",
    question: "After their memorable trip, what were Bunny and Avi supposed to do?",
    model: "quest5",
    options: [
      { id: "radio1", name: "Go for higher studies " },
      { id: "radio2", name: "Daaru ka adda", answer: true },
    ],
  },
  {
    id: 6,
    quesNo: "Q6",
    question: "Where do Badri and Somdev go while searching for Vaidehi?",
    model: "quest6",
    options: [
      { id: "radio1", name: "Dubai" },
      { id: "radio2", name: "Singapore", answer: true },
    ],
  },
  {
    id: 7,
    quesNo: "Q7",
    question: "Whose exam result brings down the vibe of the entire group?",
    model: "quest7",
    options: [
      { id: "radio1", name: "Rishi" },
      { id: "radio2", name: "Sid", answer: true },
    ],
  },
  {
    id: 8,
    quesNo: "Q8",
    question: "Pyaaar me Junoon hai par dosti me ____ hai?",
    model: "quest7",
    options: [
      { id: "radio1", name: "Fitoor" },
      { id: "radio2", name: "Sukoon", answer: true },
    ],
  },
  {
    id: 9,
    quesNo: "Q9",
    question: "Where did Naina know Aditi, Bunny and Avi from?",
    model: "quest7",
    options: [
      { id: "radio1", name: "Tania's Party" },
      { id: "radio2", name: "High School mates", answer: true },
    ],
  },
  {
    id: 10,
    quesNo: "Q10",
    question: "How does Tina save Rahul and Anjali at the inter college competition?",
    model: "quest7",
    options: [
      { id: "radio1", name: "By singing Koi Mil Gaya", answer: true },
      { id: "radio2", name: "By singing Om Jai Jagdish" },
    ],
  },
];
