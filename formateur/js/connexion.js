const API_URL =
  "https://virformateur.cscpacman.fr";

const form =
  document.getElementById("login-form");

const errorBox =
  document.getElementById("login-error");

const submit =
  document.getElementById("login-submit");

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
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

    const data =
      await response
        .json()
        .catch(() => ({}));

    // Session encore valide
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

    // Token invalide ou expiré
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

    submit.disabled = true;
    submit.textContent =
      "Connexion…";

    try {

      const response =
        await fetch(
          `${API_URL}/api/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              identifiant,
              motdepasse,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (response.status === 401) {
        showError(
          "Identifiant ou mot de passe incorrect."
        );

        return;
      }

      if (response.status === 403) {
        showError(
          data.error ||
          "Votre compte est bloqué."
        );

        return;
      }

      if (!response.ok) {
        showError(
          data.error ||
          "Le service de connexion est indisponible."
        );

        return;
      }

      if (!data.token) {
        showError(
          "Le serveur n'a pas fourni de session."
        );

        return;
      }

      // ==============================
      // SAUVEGARDE DE LA SESSION
      // ==============================

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

      // ==============================
      // DASHBOARD
      // ==============================

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

      submit.disabled = false;
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
