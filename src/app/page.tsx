"use client";

import { useEffect, useState } from "react";
import { openDB } from "idb";

// Define a type for quiz questions
interface Question {
  id: number;
  type: "mcq" | "integer"; // Allow only these two types
  question: string;
  options?: string[]; // Only for MCQs
  answer: string;
}

// Define the quiz questions
const questions: Question[] = [
  { id: 1, type:"mcq",question: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", " Earth", " Mars"], answer: "Mercury" },
  { id: 2, type:"mcq" ,question: "Which data structure organizes items in a First-In, First-Out (FIFO) manner", options: ["Stack", "Queue", "Tree", "Graph"], answer: "Queue" },
  { id: 3, type:"mcq" ,question: "Which of the following is primarily used for structuring web pages?", options: ["Python", "Java", "HTML", "C++"], answer: "HTML" },
  { id: 4, type:"mcq" ,question: "Which chemical symbol stands for Gold?", options: ["Au", "Gd", "Ag", "Pt"], answer: "Au" },
  { id: 5,type:"mcq" , question: "Which of these processes is not typically involved in refining petroleum", options: ["Fractional distillation", "Cracking", "Polymerization", "Filtration"], answer: "Fractional distillation" },
  { id: 6,type:"integer" , question: " What is the value of 12 + 28?",  answer: "40" },
  { id: 7,type:"integer" , question: " How many states are there in the United States?",  answer: "50" },
  { id: 8,type:"integer" , question: " In which year was the Declaration of Independence signed ",  answer: "1776" },
  { id: 9,type:"integer" , question: "What is the value of pi rounded to the nearest integer ",  answer: "3" },
  { id: 10,type:"integer" , question: "  If a car travels at 60 mph for 2 hours, how many miles does it travel",  answer: "120" },
];

const initDB = async () => {
  return openDB("quizDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("attempts")) {
        db.createObjectStore("attempts", { keyPath: "id", autoIncrement: true });
      }
    },
  });
};

interface Attempt {
  question: string;
  selectedAnswer: string | null;
  correct: boolean;
}

export default function QuizApp() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [timer, setTimer] = useState(30);
  const [inputAnswer, setInputAnswer] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      handleNext();
    }
  }, [timer]);

  const saveAttempt = async (attempt: Attempt) => {
    const db = await initDB();
    const tx = db.transaction("attempts", "readwrite");
    const store = tx.objectStore("attempts");
    await store.add(attempt);
  };

  const handleAnswerClick = (option: string) => {
    setSelectedAnswer(option);
    if (option === questions[currentQuestion].answer) {
      setFeedback("✅ Correct!");
      setScore((prev) => prev + 1);
    } else {
      setFeedback("❌ Incorrect!");
    }
  };

  const handleAnswerSubmit = () => {
    if (questions[currentQuestion].type === "integer") {
      if (inputAnswer.trim() === questions[currentQuestion].answer) {
        setFeedback("✅ Correct!");
        setScore((prev) => prev + 1);
      } else {
        setFeedback("❌ Incorrect!");
      }
      setSelectedAnswer(inputAnswer);
    }
  };

  const handleNext = async () => {
    const attempt: Attempt = {
      question: questions[currentQuestion].question,
      selectedAnswer,
      correct: feedback === "✅ Correct!",
    };

    setAttempts((prev) => [...prev, attempt]);
    await saveAttempt(attempt);
    setSelectedAnswer(null);
    setFeedback(null);
    setInputAnswer("");
    setTimer(30);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      alert(`🎉 Quiz Completed! Your score: ${score}/${questions.length}`);
      setCurrentQuestion(0);
      setScore(0);
      setAttempts([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
    {/* Navbar */}
    <nav className="bg-white shadow-md py-4 px-6 flex justify-center fixed top-50 left-50 w-full">
      <h1 className="text-2xl font-bold text-gray-800">Quizo</h1>
    </nav>

    {/* Quiz Container */}
    <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="p-8 max-w-lg w-full bg-white shadow-2xl rounded-xl text-center border border-gray-300">
          <h2 className="text-3xl font-bold mb-6 text-indigo-700">{questions[currentQuestion].question}</h2>

          {questions[currentQuestion].type === "mcq" ? (
            <div className="space-y-4">
              {questions[currentQuestion].options?.map((option, index) => {
                const labels = ["A", "B", "C", "D"];
                return (
                  <button
                    key={option}
                    className="flex w-full items-center gap-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md"
                    onClick={() => handleAnswerClick(option)}
                  >
                    <span className="font-bold">{labels[index]}.</span> {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg text-lg text-center"
                placeholder="Enter your answer"
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
              />
              <button
                className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                onClick={handleAnswerSubmit}
              >
                Submit Answer
              </button>
            </div>
          )}

          {feedback && <p className={`mt-6 text-lg font-semibold ${feedback.includes("✅") ? "text-green-600" : "text-red-600"}`}>{feedback}</p>}
          <p className="mt-4 text-gray-700">⏳ Time left: <span className="font-bold text-indigo-700">{timer}s</span></p>

          {/* Next Button */}
          <button
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            onClick={handleNext}
          >
            Next Question →
          </button>
        </div>
      </div>
    </div>
  );
}