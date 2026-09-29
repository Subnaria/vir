const API_URL = "https://virformateur.cscpacman.fr";

let currentUser = null;


/* ==================================================
   SESSION
================================================== */

function getSessionToken() {
  return localStorage.getItem("vir-session-token");
}


function clearSession() {
  localStorage.removeItem("vir-session-token");
  localStorage.removeItem("vir-user");
}


function getElement(selector) {
  return document.querySelector(selector);
}


function getElements(selector) {
  return document.querySelectorAll(selector);
}


/* ==================================================
   UTILISATEUR CONNECTÉ
================================================== */

async function loadCurrentUser() {

  const token = getSessionToken();

  if (!token) {
    window.location.href = "./connexion.html";
    return;
  }


  try {

    const response = await fetch(
      `${API_URL}/api/me`,
      {
        method: "GET",

        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      }
    );


    if (response.status === 401) {

      clearSession();

      window.location.href =
        "./connexion.html";

      return;
    }


    if (!response.ok) {
      throw new Error(
        "Impossible de récupérer la session."
      );
    }


    const data =
      await response.json();


    if (
      !data.authenticated ||
      !data.formateur
    ) {

      clearSession();

      window.location.href =
        "./connexion.html";

      return;
    }


    currentUser =
      data.formateur;


    displayUser(currentUser);

    setupRole(currentUser);

    setupNavigation();


    /*
     * Si l'utilisateur est administrateur,
     * on charge la partie administration.
     */

    if (
      currentUser.role === "admin" &&
      typeof loadAdminFormateurs === "function"
    ) {

      loadAdminFormateurs();

    }


  } catch (error) {

    console.error(
      "Erreur de session :",
      error
    );

    showConnectionError();

  }

}


/* ==================================================
   AFFICHAGE UTILISATEUR
================================================== */

function displayUser(user) {

  const nameElements =
    getElements(
      "[data-user-name]"
    );


  const matriculeElements =
    getElements(
      "[data-user-matricule]"
    );


  const roleElements =
    getElements(
      "[data-user-role]"
    );


  const avatar =
    getElement(
      "[data-user-avatar]"
    );


  const roleBadge =
    getElement(
      "[data-user-role-badge]"
    );


  nameElements.forEach(element => {

    element.textContent =
      user.nom_prenom ||
      "Utilisateur";

  });


  matriculeElements.forEach(element => {

    element.textContent =
      user.matricule ||
      "—";

  });


  roleElements.forEach(element => {

    element.textContent =
      formatRole(user.role);

  });


  if (avatar) {

    avatar.textContent =
      getInitials(
        user.nom_prenom
      );

  }


  if (roleBadge) {

    roleBadge.textContent =
      formatRole(user.role);


    roleBadge.classList.toggle(
      "admin",
      user.role === "admin"
    );

  }

}


/* ==================================================
   RÔLES
================================================== */

function formatRole(role) {

  if (role === "admin") {
    return "Administrateur";
  }


  if (role === "formateur") {
    return "Formateur";
  }


  return role ||
    "Utilisateur";

}


function getInitials(name) {

  if (!name) {
    return "?";
  }


  const parts =
    name
      .trim()
      .split(/\s+/);


  if (parts.length === 1) {

    return parts[0]
      .substring(0, 2)
      .toUpperCase();

  }


  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();

}


/* ==================================================
   DROITS
================================================== */

function setupRole(user) {

  const isAdmin =
    user.role === "admin";


  document.body.classList.toggle(
    "is-admin",
    isAdmin
  );

}


/* ==================================================
   NAVIGATION
================================================== */

function setupNavigation() {

  const links =
    getElements(
      ".dashboard-nav"
    );


  const sections =
    getElements(
      "[data-section-content]"
    );


  function showSection(sectionName) {

    /*
     * Valeurs autorisées pour les sections
     * principales du tableau de bord.
     */

    const allowedSections = [
      "accueil",
      "formation-agent",
      "evaluations",
      "administration"
    ];


    /*
     * Si une section inconnue est demandée
     * dans l'URL, retour à l'accueil.
     */

    if (
      !allowedSections.includes(
        sectionName
      )
    ) {

      sectionName =
        "accueil";

    }


    /*
     * L'administration reste réservée
     * aux administrateurs.
     */

    if (
      sectionName === "administration" &&
      currentUser?.role !== "admin"
    ) {

      sectionName =
        "accueil";

    }


    /*
     * Affichage des sections.
     */

    sections.forEach(section => {

      const active =
        section.dataset.sectionContent ===
        sectionName;


      section.classList.toggle(
        "is-active",
        active
      );

    });


    /*
     * État actif de la navigation.
     */

    links.forEach(link => {

      const active =
        link.dataset.section ===
        sectionName;


      link.classList.toggle(
        "is-active",
        active
      );

    });


    /*
     * Mise à jour de l'URL.
     */

    history.replaceState(
      null,
      "",
      `#${sectionName}`
    );

  }


  /*
   * Gestion des boutons de navigation.
   */

  links.forEach(link => {

    link.addEventListener(
      "click",
      event => {

        event.preventDefault();


        showSection(
          link.dataset.section
        );

      }
    );

  });


  /*
   * Section demandée dans l'URL.
   */

  const initialSection =
    window.location.hash
      .replace("#", "")
      .trim();


  showSection(
    initialSection ||
    "accueil"
  );

}


/* ==================================================
   DÉCONNEXION
================================================== */

function setupLogout() {

  const button =
    getElement(
      "#logout-button"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    async () => {

      const token =
        getSessionToken();


      button.disabled =
        true;


      try {

        if (token) {

          await fetch(
            `${API_URL}/api/logout`,
            {
              method: "POST",

              headers: {
                "Authorization":
                  `Bearer ${token}`
              }
            }
          );

        }

      } catch (error) {

        console.error(
          "Erreur de déconnexion :",
          error
        );

      } finally {

        clearSession();


        window.location.href =
          "./connexion.html";

      }

    }
  );

}


/* ==================================================
   ERREUR DE CONNEXION
================================================== */

function showConnectionError() {

  const existing =
    document.getElementById(
      "dashboard-connection-error"
    );


  if (existing) {
    return;
  }


  const error =
    document.createElement(
      "div"
    );


  error.id =
    "dashboard-connection-error";


  error.className =
    "status-badge";


  error.style.marginTop =
    "16px";


  error.textContent =
    "Impossible de vérifier la session. Vérifiez votre connexion.";


  const main =
    document.querySelector(
      ".page-wrap"
    );


  if (main) {

    main.prepend(
      error
    );

  }

}


/* ==================================================
   INITIALISATION
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupLogout();

    loadCurrentUser();

  }
);