const API_URL =
  "https://virformateur.cscpacman.fr";

const form =
  document.getElementById("login-form");

const errorBox =
  document.getElementById("login-error");

const submit =
  document.getElementById("login-submit");

// ==================================================
// RATE LIMIT CONNEXION
// ==================================================

const LOGIN_COOLDOWN = 5000; // 5 secondes
let lastLoginAttempt = 0;

// ==================================================
// AFFICHER UNE ERREUR
// ==================================================

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

// ==================================================
// VÉRIFIER LA SESSION EXISTANTE
// ==================================================

async function checkExistingSession() {

  const token =
    localStorage.getItem("vir-session-token");

  if (!token) {
    return;
  }

  try {

    const response =
      await fetch(`${API_URL}/api/me`, {
        method: "GET",

        headers: {
          "Accept":
            "application/json",

          "Authorization":
            `Bearer ${token}`,
        },
      });

    const data =
      await response
        .json()
        .catch(() => ({}));

    // ==========================================
    // SESSION ENCORE VALIDE
    // ==========================================

    if (
      response.ok &&
      data.authenticated &&
      data.formateur
    ) {

      localStorage.setItem(
        "vir-user",
        JSON.stringify({

          id:
            data.formateur.id,

          nom_prenom:
            data.formateur.nom_prenom,

          matricule:
            data.formateur.matricule,

          role:
            data.formateur.role,
        })
      );

      window.location.replace(
        "./tableau-de-bord.html"
      );

      return;
    }

    // ==========================================
    // TOKEN INVALIDE OU EXPIRÉ
    // ==========================================

    localStorage.removeItem(
      "vir-session-token"
    );

    localStorage.removeItem(
      "vir-user"
    );

  } catch (error) {

    console.error(
      "Impossible de vérifier la session :",
      error
    );

    // On ne bloque pas la connexion manuelle.
    // Le formulaire reste disponible.
  }
}

// ==================================================
// CONNEXION MANUELLE
// ==================================================

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    errorBox.hidden = true;

    // ==========================================
    // RATE LIMIT LOCAL
    // ==========================================

    const now =
      Date.now();

    const timeSinceLastAttempt =
      now - lastLoginAttempt;

    if (
      timeSinceLastAttempt <
      LOGIN_COOLDOWN
    ) {

      const remaining =
        Math.ceil(
          (
            LOGIN_COOLDOWN -
            timeSinceLastAttempt
          ) / 1000
        );

      showError(
        `Veuillez patienter ${remaining} seconde(s) avant de réessayer.`
      );

      return;
    }

    // Enregistre la tentative
    lastLoginAttempt =
      now;

    // ==========================================
    // RÉCUPÉRATION DES IDENTIFIANTS
    // ==========================================

    const identifiant =
      form.identifiant.value.trim();

    const motdepasse =
      form.motdepasse.value;

    if (
      !identifiant ||
      !motdepasse
    ) {

      showError(
        "Renseignez votre identifiant et votre mot de passe."
      );

      return;
    }

    // ==========================================
    // BOUTON DE CONNEXION
    // ==========================================

    submit.disabled =
      true;

    submit.textContent =
      "Connexion…";

    try {

      // ========================================
      // REQUÊTE API
      // ========================================

      const response =
        await fetch(
          `${API_URL}/api/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Accept":
                "application/json",
            },

            body:
              JSON.stringify({
                identifiant,
                motdepasse,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      // ========================================
      // IDENTIFIANTS INCORRECTS
      // ========================================

      if (
        response.status ===
        401
      ) {

        showError(
          "Identifiant ou mot de passe incorrect."
        );

        return;
      }

      // ========================================
      // COMPTE BLOQUÉ
      // ========================================

      if (
        response.status ===
        403
      ) {

        showError(
          data.error ||
          "Votre compte est bloqué."
        );

        return;
      }

      // ========================================
      // RATE LIMIT SERVEUR
      // ========================================

      if (
        response.status ===
        429
      ) {

        showError(
          data.error ||
          "Trop de tentatives. Veuillez patienter avant de réessayer."
        );

        return;
      }

      // ========================================
      // AUTRE ERREUR
      // ========================================

      if (!response.ok) {

        showError(
          data.error ||
          "Le service de connexion est indisponible."
        );

        return;
      }

      // ========================================
      // VÉRIFICATION DU TOKEN
      // ========================================

      if (!data.token) {

        showError(
          "Le serveur n'a pas fourni de session."
        );

        return;
      }

      // ========================================
      // SAUVEGARDE DE LA SESSION
      // ========================================

      localStorage.setItem(
        "vir-session-token",
        data.token
      );

      localStorage.setItem(
        "vir-user",
        JSON.stringify({

          nom_prenom:
            data.nom_prenom,

          matricule:
            data.matricule,

          role:
            data.role,
        })
      );

      // ========================================
      // REDIRECTION DASHBOARD
      // ========================================

      window.location.replace(
        "./tableau-de-bord.html"
      );

    } catch (error) {

      console.error(
        "Erreur de connexion :",
        error
      );

      showError(
        "Impossible de joindre le serveur. Vérifiez votre connexion."
      );

    } finally {

      submit.disabled =
        false;

      submit.textContent =
        "Se connecter";
    }
  }
);

// ==================================================
// INITIALISATION
// ==================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    checkExistingSession();
  }
);
