/* =========================================================
   VIR — ÉVALUATION OFFICIELLE
   ========================================================= */

(() => {
  "use strict";


  /* ======================================================
     DONNÉES
     ====================================================== */

  const DATA = window.VIR_QUIZ;

  if (!DATA) {
    console.error(
      "VIR_QUIZ est introuvable."
    );

    return;
  }


  /* ======================================================
     UTILITAIRE DOM
     ====================================================== */

  const $ = (id) =>
    document.getElementById(id);


  /* ======================================================
     ÉCRANS
     ====================================================== */

  const screens = {

    access:
      $("evaluation-access"),

    ready:
      $("evaluation-ready"),

    play:
      $("evaluation-play"),

    result:
      $("evaluation-result")

  };


  /* ======================================================
     ÉLÉMENTS
     ====================================================== */

  const codeForm =
    $("evaluation-code-form");

  const codeInput =
    $("evaluation-code");

  const codeError =
    $("evaluation-error");

  const codeSubmit =
    $("evaluation-submit");

  const startButton =
    $("evaluation-start");


  /* ======================================================
     VÉRIFICATION STRUCTURE
     ====================================================== */

  if (
    Object.values(screens).some(
      (screen) => !screen
    )
  ) {
    console.error(
      "Structure HTML de l'évaluation incomplète."
    );

    return;
  }


  /* ======================================================
     CONFIGURATION
     ====================================================== */

  const VIR_API_URL =
    "https://virformateur.cscpacman.fr";


  /*
   * Score minimum nécessaire.
   */

  const PASSING_SCORE = 24;


  /*
   * Nombre attendu de questions.
   */

  const EXPECTED_QUESTIONS = 28;


  /*
   * État de l'évaluation.
   */

  let evaluationCode = "";

  let session = null;

  let codeValidated = false;


  /* ======================================================
     UTILITAIRES
     ====================================================== */

  function shuffle(list) {

    const array = [
      ...list
    ];

    for (
      let i = array.length - 1;
      i > 0;
      i--
    ) {

      const j =
        Math.floor(
          Math.random() *
          (i + 1)
        );

      [
        array[i],
        array[j]
      ] = [
        array[j],
        array[i]
      ];

    }

    return array;
  }


  function createElement(
    tag,
    className,
    text
  ) {

    const element =
      document.createElement(tag);

    if (className) {
      element.className =
        className;
    }

    if (
      text !== undefined
    ) {
      element.textContent =
        text;
    }

    return element;
  }


  /* ======================================================
     NAVIGATION
     ====================================================== */

  const LOCKABLE =
    ".sidebar a, .topbar a, .page-footer a";


  function isCurrent(link) {

    return (
      link.getAttribute(
        "aria-current"
      ) === "page"
    );

  }


  function setLocked(locked) {

    document.body.classList.toggle(
      "quiz-locked",
      locked
    );


    document
      .querySelectorAll(LOCKABLE)
      .forEach((link) => {

        if (
          isCurrent(link)
        ) {
          return;
        }


        if (locked) {

          link.setAttribute(
            "aria-disabled",
            "true"
          );

          link.tabIndex = -1;

        } else {

          link.removeAttribute(
            "aria-disabled"
          );

          link.removeAttribute(
            "tabindex"
          );

        }

      });


    window.onbeforeunload =
      locked
        ? () => ""
        : null;

  }


  /*
   * Empêche de quitter l'évaluation
   * via les liens du site.
   */

  document.addEventListener(
    "click",
    (event) => {

      const link =
        event.target.closest?.(
          LOCKABLE
        );


      if (
        link &&
        document.body.classList.contains(
          "quiz-locked"
        ) &&
        !isCurrent(link)
      ) {

        event.preventDefault();

      }

    },
    true
  );


  function showScreen(name) {

    Object.entries(
      screens
    ).forEach(
      ([key, screen]) => {

        screen.hidden =
          key !== name;

      }
    );


    /*
     * Navigation verrouillée uniquement
     * pendant les questions.
     */

    setLocked(
      name === "play"
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  /* ======================================================
     CODE D'ÉVALUATION
     ====================================================== */

  function showCodeError(message) {

    codeError.textContent =
      message;

    codeError.hidden =
      false;


    codeInput.classList.add(
      "is-invalid"
    );

  }


  function clearCodeError() {

    codeError.textContent =
      "";

    codeError.hidden =
      true;


    codeInput.classList.remove(
      "is-invalid"
    );

  }


  /* ======================================================
     VÉRIFICATION DU CODE
     ====================================================== */

  async function validateCode(code) {

    const response =
      await fetch(
        `${VIR_API_URL}/api/evaluations/verify-code`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              code
            })
        }
      );


    let data = {};


    try {

      data =
        await response.json();

    } catch {

      data = {};

    }


    if (!response.ok) {

      return {

        valid: false,

        error:
          data.error ||
          "Code de formation invalide ou expiré.",

        status:
          response.status

      };

    }


    return {

      valid:
        data.valid === true,

      code:
        data.code || code,

      status:
        response.status

    };

  }


  /* ======================================================
     VALIDATION DU FORMULAIRE
     ====================================================== */

  codeForm?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      clearCodeError();


      const code =
        codeInput.value
          .trim()
          .toUpperCase();


      if (!code) {

        showCodeError(
          "Veuillez entrer votre code de formation."
        );

        codeInput.focus();

        return;

      }


      codeSubmit.disabled =
        true;

      codeSubmit.textContent =
        "Vérification…";


      try {

        console.log(
          "[VIR] Vérification du code :",
          code
        );


        const result =
          await validateCode(
            code
          );


        if (!result.valid) {


          if (
            result.status === 404
          ) {

            showCodeError(
              "Ce code d'évaluation n'existe pas."
            );

          } else if (
            result.status === 409
          ) {

            showCodeError(
              "Ce code d'évaluation a déjà été utilisé."
            );

          } else if (
            result.status === 400
          ) {

            showCodeError(
              "Veuillez entrer un code d'évaluation valide."
            );

          } else {

            showCodeError(
              result.error ||
              "Code de formation invalide ou expiré."
            );

          }


          return;

        }


        evaluationCode =
          result.code ||
          code;


        codeValidated =
          true;


        console.log(
          "[VIR] Code validé :",
          evaluationCode
        );


        showScreen(
          "ready"
        );


      } catch (error) {

        console.error(
          "[VIR] Erreur de validation du code :",
          error
        );


        showCodeError(
          "Impossible de vérifier le code. Vérifiez votre connexion puis réessayez."
        );


      } finally {

        codeSubmit.disabled =
          false;

        codeSubmit.textContent =
          "Accéder à l'évaluation";

      }

    }
  );


  /* ======================================================
     CRÉATION DE L'ÉVALUATION
     ====================================================== */

  function createSession() {

    const questions = [
      ...DATA.questions
    ];


    if (
      questions.length !==
      EXPECTED_QUESTIONS
    ) {

      console.warn(
        `L'évaluation attend ${EXPECTED_QUESTIONS} questions mais ${questions.length} questions sont disponibles.`
      );

    }


    session = {

      code:
        evaluationCode,


      /*
       * Mélange des questions.
       */

      items:
        shuffle(
          questions
        ).map(
          (question) => {

            /*
             * Conservation de la bonne réponse.
             */

            const correctAnswer =
              question.options[
                question.answer
              ];


            /*
             * Mélange des réponses.
             */

            return {

              q:
                question,

              correctAnswer,

              options:
                shuffle(
                  question.options.map(
                    (
                      text,
                      index
                    ) => ({

                      text,

                      correct:
                        index ===
                        question.answer

                    })
                  )
                )

            };

          }
        ),


      index: 0,

      score: 0,

      missed: [],

      locked: false

    };


    /*
     * Évite autant que possible
     * deux bonnes réponses à la
     * même position consécutivement.
     */

    const getCorrectPosition =
      (item) =>
        item.options.findIndex(
          (option) =>
            option.correct
        );


    for (
      let i = 1;
      i < session.items.length;
      i++
    ) {

      const current =
        session.items[i];

      const previous =
        session.items[i - 1];


      const currentPosition =
        getCorrectPosition(
          current
        );

      const previousPosition =
        getCorrectPosition(
          previous
        );


      if (
        currentPosition ===
        previousPosition
      ) {

        const newPosition =
          (
            currentPosition +
            1 +
            Math.floor(
              Math.random() * 3
            )
          ) % 4;


        [
          current.options[
            currentPosition
          ],

          current.options[
            newPosition
          ]

        ] = [

          current.options[
            newPosition
          ],

          current.options[
            currentPosition
          ]

        ];

      }

    }


    renderQuestion();

  }


  /* ======================================================
     AFFICHAGE QUESTION
     ====================================================== */

  function renderQuestion() {

    const current =
      session.items[
        session.index
      ];


    const total =
      session.items.length;


    /*
     * Compteur.
     */

    $("evaluation-count")
      .textContent =
        `Question ${
          session.index + 1
        } sur ${total}`;


    /*
     * Module.
     */

    $("evaluation-module")
      .textContent =
        `Module ${String(
          current.q.module
        ).padStart(2, "0")} · ${
          DATA.modules[
            current.q.module
          ]
        }`;


    /*
     * Barre de progression.
     */

    $("evaluation-bar")
      .style.width =
        `${
          (session.index / total) *
          100
        }%`;


    /*
     * Question.
     */

    $("evaluation-question")
      .textContent =
        current.q.question;


    /*
     * Réponses.
     */

    const options =
      $("evaluation-options");


    options.innerHTML =
      "";


    const letters = [
      "A",
      "B",
      "C",
      "D"
    ];


    current.options.forEach(
      (
        option,
        index
      ) => {

        const button =
          createElement(
            "button",
            "option"
          );


        button.type =
          "button";


        button.append(

          createElement(
            "span",
            "key",
            letters[index]
          ),

          createElement(
            "span",
            "",
            option.text
          )

        );


        button.addEventListener(
          "click",
          () =>
            pickAnswer(index)
        );


        options.append(
          button
        );

      }
    );


    session.locked =
      false;


    showScreen(
      "play"
    );

  }


  /* ======================================================
     RÉPONSE
     ====================================================== */

  function pickAnswer(index) {

    if (
      !session ||
      session.locked
    ) {

      return;

    }


    /*
     * Bloque immédiatement les
     * doubles clics.
     */

    session.locked =
      true;


    const current =
      session.items[
        session.index
      ];


    const selected =
      current.options[
        index
      ];


    const correct =
      selected.correct;


    /*
     * Calcul du score.
     */

    if (correct) {

      session.score++;

    } else {

      session.missed.push(
        current
      );

    }


    /*
     * Désactivation immédiate
     * des boutons.
     */

    [
      ...$("evaluation-options")
        .children

    ].forEach(
      (button) => {

        button.disabled =
          true;

      }
    );


    /*
     * IMPORTANT :
     *
     * Aucune indication de bonne
     * ou mauvaise réponse.
     *
     * Aucune explication.
     *
     * Aucun bouton "Question suivante".
     *
     * On passe directement à la
     * prochaine question.
     */

    setTimeout(
      () => {

        nextQuestion();

      },
      120
    );

  }


  /* ======================================================
     QUESTION SUIVANTE
     ====================================================== */

  function nextQuestion() {

    if (!session) {
      return;
    }


    session.index++;


    /*
     * Fin de l'évaluation.
     */

    if (
      session.index >=
      session.items.length
    ) {

      renderResult();

      return;

    }


    /*
     * Question suivante.
     */

    renderQuestion();

  }


  /* ======================================================
     RÉSULTAT FINAL
     ====================================================== */

  function renderResult() {

    const total =
      session.items.length;


    const percentage =
      Math.round(
        (
          session.score /
          total
        ) * 100
      );


    const passed =
      session.score >=
      PASSING_SCORE;


    /*
     * Score.
     */

    $("evaluation-result-score")
      .textContent =
        `${session.score} / ${total}`;


    /*
     * Pourcentage.
     */

    $("evaluation-result-pct")
      .textContent =
        `${percentage} % de bonnes réponses`;


    /*
     * Message final.
     */

    let message;


    if (passed) {

      if (
        session.score ===
        total
      ) {

        message =
          "Évaluation réussie sans faute. La doctrine VIR est parfaitement maîtrisée.";

      } else {

        message =
          `Évaluation réussie. Vous avez atteint le minimum requis de ${PASSING_SCORE}/${EXPECTED_QUESTIONS}.`;

      }

    } else {

      message =
        `Évaluation échouée. Un minimum de ${PASSING_SCORE}/${EXPECTED_QUESTIONS} est requis pour réussir.`;

    }


    $("evaluation-result-msg")
      .textContent =
        message;


    /*
     * Résultat par module.
     */

    const moduleList =
      $("evaluation-result-modules");


    moduleList.innerHTML =
      "";


    Object.keys(
      DATA.modules
    ).forEach(
      (module) => {

        const moduleQuestions =
          session.items.filter(
            (item) =>
              String(
                item.q.module
              ) === String(module)
          );


        const moduleErrors =
          session.missed.filter(
            (item) =>
              String(
                item.q.module
              ) === String(module)
          );


        const moduleScore =
          moduleQuestions.length -
          moduleErrors.length;


        const li =
          createElement(
            "li"
          );


        li.append(

          createElement(
            "span",
            "",
            DATA.modules[
              module
            ]
          ),

          createElement(
            "strong",
            "",
            `${moduleScore} / ${moduleQuestions.length}`
          )

        );


        moduleList.append(
          li
        );

      }
    );


    /*
     * Questions ratées.
     */

    const missedBox =
      $("evaluation-result-missed");


    const missedList =
      $("evaluation-result-missed-list");


    missedList.innerHTML =
      "";


    session.missed.forEach(
      (item) => {

        const li =
          createElement(
            "li"
          );


        li.append(

          createElement(
            "strong",
            "",
            item.q.question
          ),

          createElement(
            "span",
            "",
            `Bonne réponse : ${item.correctAnswer}`
          )

        );


        missedList.append(
          li
        );

      }
    );


    missedBox.hidden =
      session.missed.length === 0;


    /*
     * Affichage résultat.
     */

    showScreen(
      "result"
    );


    /*
     * Log développeur.
     */

    console.log(
      "[VIR] Évaluation terminée",
      {
        code:
          evaluationCode,

        score:
          session.score,

        total,

        percentage,

        passed,

        missed:
          session.missed.map(
            (item) =>
              item.q.id
          )

      }
    );

  }


  /* ======================================================
     BOUTON COMMENCER
     ====================================================== */

  startButton?.addEventListener(
    "click",
    () => {

      if (!codeValidated) {

        showScreen(
          "access"
        );

        return;

      }


      createSession();

    }
  );


  /* ======================================================
     RACCOURCIS CLAVIER
     ====================================================== */

  document.addEventListener(
    "keydown",
    (event) => {

      /*
       * Uniquement pendant les questions.
       */

      if (
        screens.play.hidden ||
        !session ||
        session.locked
      ) {

        return;

      }


      const number =
        Number(
          event.key
        );


      if (
        number >= 1 &&
        number <= 4
      ) {

        pickAnswer(
          number - 1
        );

      }

    }
  );


  /* ======================================================
     INITIALISATION
     ====================================================== */

  showScreen(
    "access"
  );

})();