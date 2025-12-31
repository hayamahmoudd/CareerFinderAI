/*
  Dynamic Quiz System - Asks follow-up questions based on user responses
*/

// Quiz structure with conditional questions
const quizData = {
  q1: {
    question: "What do you enjoy more?",
    options: [
      { value: "working with people", label: "Working with people", next: "q2_people" },
      { value: "solving technical problems", label: "Solving technical problems", next: "q2_technical" },
      { value: "organizing and planning", label: "Organizing and planning", next: "q2_organizing" }
    ]
  },
  
  // Follow-up questions for "working with people"
  q2_people: {
    question: "When working with people, what appeals to you most?",
    options: [
      { value: "speaking to large audiences", label: "Speaking to large audiences", next: "q3" },
      { value: "one-on-one interactions", label: "One-on-one interactions and counseling", next: "q3" },
      { value: "leading and managing teams", label: "Leading and managing teams", next: "q3" }
    ]
  },
  
  // Follow-up questions for "solving technical problems"
  q2_technical: {
    question: "What type of technical work interests you?",
    options: [
      { value: "building software and applications", label: "Building software and applications", next: "q3" },
      { value: "analyzing data and patterns", label: "Analyzing data and finding patterns", next: "q3" },
      { value: "hands-on mechanical work", label: "Hands-on mechanical or engineering work", next: "q3" }
    ]
  },
  
  // Follow-up questions for "organizing and planning"
  q2_organizing: {
    question: "What kind of organizing do you prefer?",
    options: [
      { value: "project management", label: "Managing projects and timelines", next: "q3" },
      { value: "financial planning", label: "Financial planning and budgeting", next: "q3" },
      { value: "event coordination", label: "Event coordination and logistics", next: "q3" }
    ]
  },
  
  q3: {
    question: "What environment do you prefer?",
    options: [
      { value: "outdoors", label: "Outdoors", next: "q4" },
      { value: "office setting", label: "Office setting", next: "q4" },
      { value: "lab or workshop", label: "Lab or workshop", next: "q4" },
      { value: "remote or flexible", label: "Remote or flexible locations", next: "q4" }
    ]
  },
  
  q4: {
    question: "Which subject do you like most?",
    options: [
      { value: "biology and life sciences", label: "Biology and Life Sciences", next: "q5" },
      { value: "math and coding", label: "Math and Coding", next: "q5" },
      { value: "writing and communication", label: "Writing and Communication", next: "q5" },
      { value: "arts and design", label: "Arts and Design", next: "q5" }
    ]
  },
  
  q5: {
    question: "What's your preferred work style?",
    options: [
      { value: "structured with clear guidelines", label: "Structured with clear guidelines", next: "q6" },
      { value: "flexible and creative", label: "Flexible and creative", next: "q6" },
      { value: "fast-paced and dynamic", label: "Fast-paced and dynamic", next: "q6" }
    ]
  },
  
  q6: {
    question: "What motivates you most in a career?",
    options: [
      { value: "helping others", label: "Helping others and making an impact", next: null },
      { value: "financial success", label: "Financial success and stability", next: null },
      { value: "creative expression", label: "Creative expression and innovation", next: null },
      { value: "continuous learning", label: "Continuous learning and growth", next: null }
    ]
  }
};

// State management
let currentQuestionId = "q1";
let answers = {};
let questionPath = ["q1"];

// Initialize quiz
function initQuiz() {
  renderQuestion();
  updateProgress();
  setupEventListeners();
}

// Render current question
function renderQuestion() {
  const container = document.getElementById("questionsContainer");
  const questionData = quizData[currentQuestionId];
  
  let html = `
    <div class="question">
      <label>${questionData.question}</label><br>
  `;
  
  questionData.options.forEach((option, index) => {
    const inputId = `${currentQuestionId}_${index}`;
    const checked = answers[currentQuestionId] === option.value ? 'checked' : '';
    html += `
      <label for="${inputId}">
        <input type="radio" id="${inputId}" name="${currentQuestionId}" value="${option.value}" data-next="${option.next}" ${checked} required>
        ${option.label}
      </label><br>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

// Update progress bar
function updateProgress() {
  const currentIndex = questionPath.indexOf(currentQuestionId) + 1;
  const total = 6; // Total questions to show
  const percentage = (currentIndex / total) * 100;
  
  document.getElementById("currentQ").textContent = currentIndex;
  document.getElementById("totalQ").textContent = total;
  document.getElementById("progressBar").style.width = percentage + "%";
  
  // Show/hide previous button
  const prevBtn = document.getElementById("prevBtn");
  if (currentIndex > 1) {
    prevBtn.classList.remove("hidden");
  } else {
    prevBtn.classList.add("hidden");
  }
  
  // Update next button text
  const nextBtn = document.getElementById("nextBtn");
  if (quizData[currentQuestionId].options[0].next === null) {
    nextBtn.textContent = "Get My Career Recommendations";
  } else {
    nextBtn.textContent = "Next";
  }
}

// Setup event listeners
function setupEventListeners() {
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  
  nextBtn.onclick = handleNext;
  prevBtn.onclick = handlePrevious;
}

// Handle next button
function handleNext() {
  const selectedOption = document.querySelector(`input[name="${currentQuestionId}"]:checked`);
  
  if (!selectedOption) {
    alert("Please select an option before continuing.");
    return;
  }
  
  // Save answer
  answers[currentQuestionId] = selectedOption.value;
  
  // Check if this is the last question
  const nextQuestionId = selectedOption.dataset.next;
  
  if (nextQuestionId === "null" || !nextQuestionId) {
    // Submit quiz
    submitQuiz();
  } else {
    // Move to next question
    currentQuestionId = nextQuestionId;
    questionPath.push(currentQuestionId);
    renderQuestion();
    updateProgress();
  }
}

// Handle previous button
function handlePrevious() {
  if (questionPath.length > 1) {
    questionPath.pop();
    currentQuestionId = questionPath[questionPath.length - 1];
    renderQuestion();
    updateProgress();
  }
}

// Submit quiz and get results
async function submitQuiz() {
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const originalButtonText = nextBtn.textContent;
  
  // Show loading state
  nextBtn.disabled = true;
  prevBtn.disabled = true;
  nextBtn.innerHTML = 'Analyzing... <span class="loading"></span>';
  
  // Format answers for API
  const answerText = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  const usrInput = `Here are my quiz answers:\n${answerText}\n\nBased on these detailed answers, please recommend 2-3 highly specific career paths that match my profile.`;
  
  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usrInput }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem("careerResult", JSON.stringify(data));
      window.location.href = "results.html";
    } else {
      alert(data.message || "Unable to get career recommendations. Please try again.");
      nextBtn.disabled = false;
      prevBtn.disabled = false;
      nextBtn.textContent = originalButtonText;
    }
  } catch (error) {
    console.error("Error submitting quiz:", error);
    alert("Network error. Please check your connection and try again.");
    nextBtn.disabled = false;
    prevBtn.disabled = false;
    nextBtn.textContent = originalButtonText;
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initQuiz);