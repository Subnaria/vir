/* =========================================================
   GÉNÉRATION DES CODES D'ÉVALUATION VIR
   ========================================================= */

const VIR_API_URL = "https://virformateur.cscpacman.fr";

/* =========================================================
   RÉCUPÉRATION DU TOKEN
   ========================================================= */

function getAuthToken() {
  return localStorage.getItem("vir-session-token");
}

/* =========================================================
   APPEL API
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Session formateur introuvable.");
  }

  const response = await fetch(`${VIR_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      "Une erreur est survenue."
    );
  }

  return data;
}

/* =========================================================
   GÉNÉRER UN CODE
   ========================================================= */

async function generateEvaluationCode() {
  const button = document.getElementById("generate-code-btn");
  const result = document.getElementById("generated-code");
  const message = document.getElementById("code-message");

  if (button) {
    button.disabled = true;
    button.textContent = "Génération...";
  }

  if (message) {
    message.textContent = "";
    message.className = "";
  }

  try {
    const data = await apiRequest(
      "/api/admin/evaluations/codes",
      {
        method: "POST"
      }
    );

    if (!data.code) {
      throw new Error(
        "Le serveur n'a pas retourné de code."
      );
    }

    if (result) {
      result.textContent = data.code;
      result.classList.add("visible");
    }

    if (message) {
      message.textContent =
        "Code généré avec succès.";

      message.className = "success";
    }

    return data.code;

  } catch (error) {
    console.error(
      "[VIR] Erreur génération code :",
      error
    );

    if (message) {
      message.textContent = error.message;
      message.className = "error";
    }

    return null;

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Générer un code";
    }
  }
}

/* =========================================================
   COPIER LE CODE
   ========================================================= */

async function copyEvaluationCode() {
  const result =
    document.getElementById("generated-code");

  if (
    !result ||
    !result.textContent.trim()
  ) {
    return;
  }

  const code = result.textContent.trim();

  try {
    await navigator.clipboard.writeText(code);

    const message =
      document.getElementById("code-message");

    if (message) {
      message.textContent =
        "Code copié dans le presse-papiers.";

      message.className = "success";
    }

  } catch (error) {
    console.error(
      "[VIR] Impossible de copier le code :",
      error
    );
  }
}

/* =========================================================
   INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const generateButton =
    document.getElementById(
      "generate-code-btn"
    );

  const copyButton =
    document.getElementById(
      "copy-code-btn"
    );

  if (generateButton) {
    generateButton.addEventListener(
      "click",
      generateEvaluationCode
    );
  }

  if (copyButton) {
    copyButton.addEventListener(
      "click",
      copyEvaluationCode
    );
  }

});

