const ADMIN_API_URL =
  "https://virformateur.cscpacman.fr";

let adminFormateurs = [];

// ==================================================
// SESSION / AUTHENTIFICATION
// ==================================================

function getAdminSessionToken() {
  return localStorage.getItem("vir-session-token");
}

function getAuthHeaders() {
  const token = getAdminSessionToken();

  if (!token) {
    throw new Error("Session administrateur introuvable.");
  }

  return {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

// ==================================================
// REQUÊTE ADMIN
// ==================================================

async function adminFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response
    .json()
    .catch(() => ({}));

  if (response.status === 401) {
    throw new Error(
      "Votre session administrateur a expiré. Reconnectez-vous."
    );
  }

  if (response.status === 403) {
    throw new Error(
      data.error ||
      "Accès administrateur requis."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Une erreur est survenue."
    );
  }

  return {
    response,
    data,
  };
}

// ==================================================
// CHARGER LES COMPTES
// ==================================================

async function loadAdminFormateurs() {
  if (
    !document.body.classList.contains("is-admin")
  ) {
    return;
  }

  const list =
    document.getElementById("admin-users-list");

  if (!list) {
    return;
  }

  if (!getAdminSessionToken()) {
    list.innerHTML = `
      <div class="status-badge danger">
        Session administrateur introuvable.
      </div>
    `;
    return;
  }

  list.innerHTML = `
    <div class="status-badge">
      Chargement des comptes…
    </div>
  `;

  try {
    const result = await adminFetch(
      `${ADMIN_API_URL}/api/admin/formateurs`,
      {
        method: "GET",
      }
    );

    adminFormateurs =
      result.data.formateurs || [];

    updateAdminCounters(
      adminFormateurs
    );

    renderAdminFormateurs(
      adminFormateurs
    );

  } catch (error) {
    console.error(
      "Erreur administration :",
      error
    );

    list.innerHTML = `
      <div class="status-badge danger">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

// ==================================================
// COMPTEURS
// ==================================================

function updateAdminCounters(formateurs) {
  const accountCount =
    document.getElementById(
      "admin-account-count"
    );

  const activeCount =
    document.getElementById(
      "admin-active-count"
    );

  const blockedCount =
    document.getElementById(
      "admin-blocked-count"
    );

  const total =
    formateurs.length;

  const blocked =
    formateurs.filter(
      user => Number(user.blocked) === 1
    ).length;

  const active =
    total - blocked;

  if (accountCount) {
    accountCount.textContent = total;
  }

  if (activeCount) {
    activeCount.textContent = active;
  }

  if (blockedCount) {
    blockedCount.textContent = blocked;
  }
}

// ==================================================
// AFFICHAGE DES COMPTES
// ==================================================

function renderAdminFormateurs(formateurs) {
  const list =
    document.getElementById(
      "admin-users-list"
    );

  if (!list) {
    return;
  }

  if (!formateurs.length) {
    list.innerHTML = `
      <div class="status-badge">
        Aucun compte formateur.
      </div>
    `;

    return;
  }

  list.innerHTML =
    formateurs
      .map(user => {
        const blocked =
          Number(user.blocked) === 1;

        const isAdmin =
          user.role === "admin";

        const role =
          isAdmin
            ? "Administrateur"
            : "Formateur";

        return `
          <article
            class="admin-user-card"
            data-user-id="${escapeHtml(user.id)}"
          >

            <div class="admin-user-main">

              <div class="admin-user-avatar">
                ${escapeHtml(
                  getInitials(
                    user.nom_prenom
                  )
                )}
              </div>

              <div class="admin-user-info">

                <div class="admin-user-name">
                  ${escapeHtml(
                    user.nom_prenom
                  )}
                </div>

                <div class="admin-user-meta">
                  Matricule
                  <strong>
                    ${escapeHtml(
                      user.matricule
                    )}
                  </strong>
                </div>

                <div class="admin-user-badges">

                  <span class="status-badge">
                    ${role}
                  </span>

                  <span class="status-badge ${
                    blocked
                      ? "danger"
                      : "success"
                  }">
                    ${
                      blocked
                        ? "Accès bloqué"
                        : "Accès actif"
                    }
                  </span>

                </div>

              </div>

            </div>

            <div class="admin-user-actions">

              ${
                isAdmin
                  ? `
                    <button
                      class="button button-small"
                      type="button"
                      data-admin-action="edit"
                      data-user-id="${escapeHtml(
                        user.id
                      )}"
                    >
                      Modifier
                    </button>

                    <button
                      class="button button-small"
                      type="button"
                      data-admin-action="password"
                      data-user-id="${escapeHtml(
                        user.id
                      )}"
                    >
                      Mot de passe
                    </button>

                    <span class="status-badge admin">
                      Compte administrateur
                    </span>
                  `
                  : `
                    <button
                      class="button button-small"
                      type="button"
                      data-admin-action="edit"
                      data-user-id="${escapeHtml(
                        user.id
                      )}"
                    >
                      Modifier
                    </button>

                    <button
                      class="button button-small"
                      type="button"
                      data-admin-action="password"
                      data-user-id="${escapeHtml(
                        user.id
                      )}"
                    >
                      Mot de passe
                    </button>

                    <button
                      class="button button-small"
                      type="button"
                      data-admin-action="toggle-block"
                      data-user-id="${escapeHtml(
                        user.id
                      )}"
                    >
                      ${
                        blocked
                          ? "Débloquer"
                          : "Bloquer"
                      }
                    </button>

                    <button
                      class="button button-small button-danger"
                      type="button"
                      data-admin-action="delete"
                      data-user-id="${escapeHtml(
                        user.id
                      )}"
                    >
                      Supprimer
                    </button>
                  `
              }

            </div>

          </article>
        `;
      })
      .join("");

  setupAdminActions();
}

// ==================================================
// ACTIONS
// ==================================================

function setupAdminActions() {
  const buttons =
    document.querySelectorAll(
      "[data-admin-action]"
    );

  buttons.forEach(button => {
    button.addEventListener(
      "click",
      async () => {

        const action =
          button.dataset.adminAction;

        const userId =
          button.dataset.userId;

        if (!userId) {
          return;
        }

        button.disabled = true;

        try {

          if (action === "edit") {
            await openEditAccount(userId);
          }

          if (action === "password") {
            await changePassword(userId);
          }

          if (action === "toggle-block") {
            await toggleBlock(userId);
          }

          if (action === "delete") {
            await deleteFormateur(userId);
          }

        } finally {
          button.disabled = false;
        }
      }
    );
  });
}

// ==================================================
// CRÉATION
// ==================================================

function setupCreateForm() {
  const openButton =
    document.getElementById(
      "admin-create-button"
    );

  const panel =
    document.getElementById(
      "admin-create-panel"
    );

  const closeButton =
    document.getElementById(
      "admin-create-close"
    );

  const cancelButton =
    document.getElementById(
      "admin-create-cancel"
    );

  const form =
    document.getElementById(
      "admin-create-form"
    );

  if (
    !openButton ||
    !panel ||
    !form
  ) {
    return;
  }

  function open() {
    panel.hidden = false;

    panel.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function close() {
    panel.hidden = true;

    form.reset();

    const message =
      document.getElementById(
        "admin-create-message"
      );

    if (message) {
      message.hidden = true;
      message.textContent = "";
    }
  }

  openButton.addEventListener(
    "click",
    open
  );

  closeButton?.addEventListener(
    "click",
    close
  );

  cancelButton?.addEventListener(
    "click",
    close
  );

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const submit =
        document.getElementById(
          "admin-create-submit"
        );

      const formData =
        new FormData(form);

      const data = {
        nom_prenom:
          String(
            formData.get("nom_prenom") || ""
          ).trim(),

        matricule:
          String(
            formData.get("matricule") || ""
          ).trim(),

        mot_de_passe:
          String(
            formData.get("mot_de_passe") || ""
          ),

        role:
          String(
            formData.get("role") ||
            "formateur"
          ),
      };

      if (
        !data.nom_prenom ||
        !data.matricule ||
        !data.mot_de_passe
      ) {
        showCreateMessage(
          "Tous les champs sont obligatoires.",
          true
        );

        return;
      }

      submit.disabled = true;
      submit.textContent = "Création…";

      try {

        await adminFetch(
          `${ADMIN_API_URL}/api/admin/formateurs`,
          {
            method: "POST",
            body: JSON.stringify(data),
          }
        );

        showCreateMessage(
          "Le compte a été créé avec succès.",
          false
        );

        form.reset();

        await loadAdminFormateurs();

        setTimeout(() => {
          panel.hidden = true;
        }, 800);

      } catch (error) {

        console.error(
          "Création compte :",
          error
        );

        showCreateMessage(
          error.message,
          true
        );

      } finally {

        submit.disabled = false;
        submit.textContent =
          "Créer le compte";
      }
    }
  );
}

function showCreateMessage(
  message,
  error
) {
  const box =
    document.getElementById(
      "admin-create-message"
    );

  if (!box) {
    return;
  }

  box.textContent = message;
  box.hidden = false;

  box.classList.toggle(
    "is-error",
    error
  );

  box.classList.toggle(
    "is-success",
    !error
  );
}

// ==================================================
// MODIFIER
// ==================================================

async function openEditAccount(userId) {
  const user =
    adminFormateurs.find(
      item => item.id === userId
    );

  if (!user) {
    return;
  }

  const nom =
    prompt(
      "Nom et prénom :",
      user.nom_prenom
    );

  if (nom === null) {
    return;
  }

  const matricule =
    prompt(
      "Matricule :",
      user.matricule
    );

  if (matricule === null) {
    return;
  }

  let role =
    user.role;

  if (user.role !== "admin") {

    const adminRole =
      confirm(
        "Voulez-vous donner le rôle Administrateur à ce compte ?\n\nOK = Administrateur\nAnnuler = Formateur"
      );

    role =
      adminRole
        ? "admin"
        : "formateur";
  }

  try {

    await adminFetch(
      `${ADMIN_API_URL}/api/admin/formateurs/${encodeURIComponent(
        userId
      )}`,
      {
        method: "PUT",
        body: JSON.stringify({
          nom_prenom: nom.trim(),
          matricule: matricule.trim(),
          role,
        }),
      }
    );

    await loadAdminFormateurs();

  } catch (error) {

    console.error(
      "Modification compte :",
      error
    );

    alert(error.message);
  }
}

// ==================================================
// MOT DE PASSE
// ==================================================

async function changePassword(userId) {
  const user =
    adminFormateurs.find(
      item => item.id === userId
    );

  if (!user) {
    return;
  }

  const password =
    prompt(
      `Nouveau mot de passe pour ${user.nom_prenom} :`
    );

  if (password === null) {
    return;
  }

  if (!password.trim()) {
    alert(
      "Le mot de passe ne peut pas être vide."
    );

    return;
  }

  try {

    await adminFetch(
      `${ADMIN_API_URL}/api/admin/formateurs/${encodeURIComponent(
        userId
      )}/password`,
      {
        method: "POST",
        body: JSON.stringify({
          mot_de_passe: password,
        }),
      }
    );

    alert(
      "Mot de passe modifié avec succès.\n\nLe compte devra se reconnecter."
    );

  } catch (error) {

    console.error(
      "Modification mot de passe :",
      error
    );

    alert(error.message);
  }
}

// ==================================================
// BLOQUER / DÉBLOQUER
// ==================================================

async function toggleBlock(userId) {
  const user =
    adminFormateurs.find(
      item => item.id === userId
    );

  if (!user) {
    return;
  }

  const blocked =
    Number(user.blocked) === 1;

  const action =
    blocked
      ? "unblock"
      : "block";

  if (!blocked) {

    const confirmation =
      confirm(
        `Bloquer le compte de ${user.nom_prenom} ?\n\nToutes ses sessions seront immédiatement déconnectées.`
      );

    if (!confirmation) {
      return;
    }
  }

  try {

    await adminFetch(
      `${ADMIN_API_URL}/api/admin/formateurs/${encodeURIComponent(
        userId
      )}/${action}`,
      {
        method: "POST",
      }
    );

    await loadAdminFormateurs();

  } catch (error) {

    console.error(
      "Modification statut :",
      error
    );

    alert(error.message);
  }
}

// ==================================================
// SUPPRIMER
// ==================================================

async function deleteFormateur(userId) {
  const user =
    adminFormateurs.find(
      item => item.id === userId
    );

  if (!user) {
    return;
  }

  const confirmed =
    confirm(
      `Supprimer définitivement le compte de ${user.nom_prenom} ?\n\nCette action est irréversible.`
    );

  if (!confirmed) {
    return;
  }

  try {

    await adminFetch(
      `${ADMIN_API_URL}/api/admin/formateurs/${encodeURIComponent(
        userId
      )}`,
      {
        method: "DELETE",
      }
    );

    await loadAdminFormateurs();

  } catch (error) {

    console.error(
      "Suppression compte :",
      error
    );

    alert(error.message);
  }
}

// ==================================================
// UTILITAIRES
// ==================================================

function getInitials(name) {
  if (!name) {
    return "?";
  }

  const parts =
    name.trim().split(/\s+/);

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ==================================================
// INITIALISATION
// ==================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupCreateForm();

    setTimeout(() => {

      if (
        document.body.classList.contains(
          "is-admin"
        )
      ) {
        loadAdminFormateurs();
      }

    }, 300);
  }
);