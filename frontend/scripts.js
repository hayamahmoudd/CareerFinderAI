/*
  This script handles the interaction between the user and the backend API.
  Enhanced version with better error handling and loading states.
*/
document
  .getElementById("careerQuizForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = 'Analyzing... <span class="loading"></span>';

    const formData = new FormData(this);
    const answers = [];
    formData.forEach((value, key) => {
      answers.push(`${key}: ${value}`);
    });
    
    const usrInput = `Here are my quiz answers:\n${answers.join('\n')}\n\nBased on these answers, please recommend 2-3 suitable career paths for me.`;

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usrInput }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the result and navigate to results page
        localStorage.setItem("careerResult", JSON.stringify(data));
        window.location.href = "results.html";
      } else {
        // Show error message
        alert(data.message || "Unable to get career recommendations. Please try again.");
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Network error. Please check your connection and try again.");
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });