/*
  This script handles the interaction between the user and the backend API.
  It listens for form submissions, sends user input to the API, and displays the response.
  It is designed to work with the CareerFinderAI application.
*/
document
  .getElementById("careerQuizForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const answers = [];
    formData.forEach((value, key) => {
      answers.push(`${key}: ${value}`);
    });
    const usrInput = `Here are my quiz answers:\n${answers.join('\n')}\nBased on these, what career path do you recommend?`;

    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usrInput }),
    });

    const data = await response.json();
    // if (data.success) {
    //   localStorage.setItem("careerResult", data.text);
    //   window.location.href = "results.html";
    // } else {
    //   alert(data.message || "No response from API.");
    // }
    if (data.success) {
      localStorage.setItem("careerResult", JSON.stringify(data));
      window.location.href = "results.html";
    } else {
      alert(data.message || "No response from API.");
  }
  });