/* VIR — blocage des téléphones
   À charger en premier dans le <head> des pages du portail, sans "defer",
   pour rediriger avant tout affichage.
   - Téléphone détecté  -> telephone.html
   - Ordinateur / tablette sur telephone.html -> index.html

   Détection en deux temps :
   1. User-agent mobile (cas normal) ;
   2. Écran tactile de petite taille, même si le navigateur se fait passer
      pour un PC ("Version pour ordinateur" / "Desktop site"). Le mode PC change
      le user-agent et la largeur de page, mais pas la taille physique de l'écran. */
(function () {
  "use strict";
  var BLOCK_PAGE = "security/telephone.html";
  var HOME_PAGE = "index.html";
  var PHONE_MAX_SIDE = 600; // plus petit côté de l'écran (px CSS) sous lequel c'est un téléphone

  var ua = navigator.userAgent || "";
  var uaData = navigator.userAgentData;

  // 1. User-agent
  var isTabletUA = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  var phoneUA = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|BlackBerry|Opera Mini|Mobile/i.test(ua);
  var byUA = !isTabletUA && ((uaData && uaData.mobile === true) || phoneUA);

  // 2. Matériel : écran tactile + petit écran (contourne le mode "version PC")
  var s = window.screen || {};
  var smallSide = Math.min(s.width || 9999, s.height || 9999);
  var isTouch = (navigator.maxTouchPoints || 0) > 0 || "ontouchstart" in window;
  var byHardware = isTouch && smallSide < PHONE_MAX_SIDE;

  var isPhone = byUA || byHardware;

  var current = location.pathname.split("/").pop();
  var onBlockPage = current === BLOCK_PAGE;

  if (isPhone && !onBlockPage) location.replace(BLOCK_PAGE);
  else if (!isPhone && onBlockPage) location.replace(HOME_PAGE);
})();