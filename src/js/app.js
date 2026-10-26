import { destinations, places, experiences, gallery } from "./data.js";
import { translations } from "./locales.js";
import { initMap } from "./map.js";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];
const read = (key, fallback) => {
  try {
    return localStorage.getItem(`wayfarer-${key}`) || fallback;
  } catch {
    return fallback;
  }
};
const persist = (key, value) => {
  try {
    localStorage.setItem(`wayfarer-${key}`, value);
  } catch {}
};
let savedIds;
try {
  const stored = JSON.parse(read("saved", "[]"));
  savedIds = new Set(
    Array.isArray(stored)
      ? stored.filter((id) => places.some((p) => p.id === id))
      : [],
  );
} catch {
  savedIds = new Set();
}
const state = {
  lang: read("lang", "en") === "de" ? "de" : "en",
  theme: ["light", "dark", "system"].includes(read("theme", "system"))
    ? read("theme", "system")
    : "system",
  category: "all",
  query: "",
  city: "",
  sort: "recommended",
  all: false,
  destinationsExpanded: false,
  experiencesExpanded: false,
  mapCity: "Lisbon",
  mapPlaceId: null,
  detail: null,
  photo: 0,
};
const t = (key, replacements = {}) =>
  Object.entries(replacements).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    translations[state.lang][key] ?? translations.en[key] ?? key,
  );
const cityName = (city) =>
  state.lang === "de"
    ? {
        Lisbon: "Lissabon",
        Copenhagen: "Kopenhagen",
        Florence: "Florenz",
        Paris: "Paris",
        Barcelona: "Barcelona",
        Amsterdam: "Amsterdam",
        Porto: "Porto",
        Istanbul: "Istanbul",
        "New York": "New York",
        Seoul: "Seoul",
        Marrakech: "Marrakesch",
      }[city] || city
    : city;
const loc = (location) =>
  state.lang === "de"
    ? location
        .replace("Copenhagen", "Kopenhagen")
        .replace("Lisbon", "Lissabon")
        .replace("Florence", "Florenz")
        .replace("Denmark", "Dänemark")
        .replace("Italy", "Italien")
        .replace("Greece", "Griechenland")
    : location;
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  moon: '<path d="M20.8 13.2A8.5 8.5 0 0 1 10.8 3a9 9 0 1 0 10 10.2Z"/>',
  monitor:
    '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8m-4-5v5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  arrowLeft: '<path d="m15 18-6-6 6-6"/>',
  arrowRight: '<path d="m9 18 6-6-6-6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  culture: '<path d="m3 9 9-6 9 6H3Zm0 12h18M5 10v8m5-8v8m4-8v8m5-8v8"/>',
  food: '<path d="M5 3v7m3-7v7m-6-7v7a3 3 0 0 0 6 0M5 13v8M19 3c-4 4-4 9 0 9V3Zm0 9v9"/>',
  outdoors: '<path d="m3 20 7-14 7 14H3Zm11-9 3-6 5 15h-5M7 12l3 3 2-3"/>',
  hidden:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
  leaf: '<path d="M20 3C7 2 2 8 5 16c8 4 14-1 15-13ZM4 21l11-12"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  pinterest:
    '<path fill="currentColor" stroke="none" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  expand: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.compass}</svg>`;
$$('[data-close]').forEach((button) => (button.innerHTML = icon("close")));
$("#lightbox-prev").innerHTML = icon("arrowLeft");
$("#lightbox-next").innerHTML = icon("arrowRight");
$$("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
$(".saved-icon").innerHTML = icon("heart");
$(".location-icon").innerHTML = icon("pin");
$(".search-field-icon").innerHTML = icon("search");
$(".inline-search-icon").innerHTML = icon("search");
$(".map-small").innerHTML = icon("map");
$(".notice-icon").innerHTML = icon("info");

let mapController;
let toastTimer;
let draft = null;
let attemptedSubmit = false;
let modalTrigger;
function toast(message) {
  const el = $("#toast");
  clearTimeout(toastTimer);
  el.textContent = message;
  el.classList.add("visible");
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3100);
}
function goTo(id) {
  $(id)?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
}
function openModal(dialog) {
  if (dialog.open) return;
  modalTrigger = document.activeElement;
  dialog.showModal();
  document.body.classList.add("modal-open");
}
function updateSavedCount() {
  $("#saved-count").textContent = savedIds.size;
  $("#saved-button").setAttribute(
    "aria-label",
    `${t("saved")} ${savedIds.size}`,
  );
}
function toggleSaved(id) {
  const exists = savedIds.has(id);
  exists ? savedIds.delete(id) : savedIds.add(id);
  persist("saved", JSON.stringify([...savedIds]));
  updateSavedCount();
  $$(`[data-save="${id}"]`).forEach((btn) => {
    btn.classList.toggle("is-saved", !exists);
    btn.setAttribute("aria-pressed", String(!exists));
    btn.setAttribute(
      "aria-label",
      `${t(exists ? "savePlace" : "unsavePlace")}: ${places.find((p) => p.id === id)?.name[state.lang]}`,
    );
    if (btn.classList.contains("detail-save"))
      btn.innerHTML =
        icon("heart") + esc(t(exists ? "savePlace" : "unsavePlace"));
  });
  if ($("#saved-dialog").open) {
    renderSaved();
    ($("#saved-content [data-save]") || $("#saved-explore"))?.focus({
      preventScroll: true,
    });
  }
  toast(t(exists ? "savedRemoved" : "savedAdded"));
}
function photoTag(item, css = "") {
  return `<img class="${css}" src="${esc(item.image)}" alt="${esc(item.alt[state.lang])}" width="640" height="480" loading="lazy" decoding="async">`;
}
function updateCollectionToggle(
  selector,
  expanded,
  items,
  initialCount,
  more,
  less,
) {
  const button = $(selector);
  button.hidden = items.length <= initialCount;
  button.setAttribute("aria-expanded", String(expanded));
  button.innerHTML =
    `<span>${esc(t(expanded ? less : more))}</span>` +
    `<span aria-hidden="true">${expanded ? "↑" : "↓"}</span>`;
}
function renderDestinations() {
  const visible = state.destinationsExpanded
    ? destinations
    : destinations.slice(0, 4);
  $("#destination-grid").innerHTML = visible
    .map(
      (d) =>
        `<button class="destination-card" data-city="${d.id}">${photoTag(d)}<div class="destination-card-content"><span class="destination-country">${esc(d.country[state.lang])}</span><h3>${cityName(d.city)}</h3><div class="destination-card-bottom"><span>${d.count} ${t("placesUnit")} · ${t("cityGuides")}</span><span class="circle-arrow" aria-hidden="true">↗</span></div></div></button>`,
    )
    .join("");
  updateCollectionToggle(
    "#destination-more",
    state.destinationsExpanded,
    destinations,
    4,
    "showAllDestinations",
    "showFewerDestinations",
  );
}
function renderFilters() {
  $("#filter-tabs").innerHTML = ["all", "culture", "food", "outdoors", "hidden"]
    .map(
      (key) =>
        `<button class="filter-tab ${state.category === key ? "active" : ""}" data-filter="${key}" aria-pressed="${state.category === key}">${icon(key === "all" ? "grid" : key)}${t(key === "all" ? "allPlaces" : key)}</button>`,
    )
    .join("");
}
function getFilteredPlaces() {
  const query = normalize(state.query);
  const filtered = places.filter(
    (p) =>
      (!state.city || p.city === state.city) &&
      (state.category === "all" || p.category === state.category) &&
      (!query ||
        normalize(
          [
            p.name.en,
            p.name.de,
            p.city,
            cityName(p.city),
            p.country.en,
            p.country.de,
            p.description.en,
            p.description.de,
            t(p.category),
            ...(p.tags || []),
          ].join(" "),
        ).includes(query)),
  );
  if (state.sort === "rating")
    filtered.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  else if (state.sort === "name")
    filtered.sort((a, b) =>
      a.name[state.lang].localeCompare(b.name[state.lang], state.lang),
    );
  return filtered;
}
function placeCard(p) {
  const saved = savedIds.has(p.id);
  return `<article class="place-card"><div class="place-image-wrap"><button class="place-open" data-detail="${p.id}" aria-label="${esc(`${t("viewDetails")}: ${p.name[state.lang]}`)}">${photoTag(p)}</button><span class="category-pill">${t(p.category)}</span><button class="favorite-button ${saved ? "is-saved" : ""}" data-save="${p.id}" aria-pressed="${saved}" aria-label="${esc(`${t(saved ? "unsavePlace" : "savePlace")}: ${p.name[state.lang]}`)}">${icon("heart")}</button></div><div class="place-content"><p class="place-location">${icon("pin")}${cityName(p.city)}, ${p.country[state.lang]}</p><h3><button class="place-title-button" data-detail="${p.id}">${p.name[state.lang]}</button></h3><p class="place-description">${p.description[state.lang]}</p><div class="place-card-footer"><span class="place-rating" title="${esc(t("demoRatings"))}">${icon("star")}<strong>${p.rating.toLocaleString(state.lang, { minimumFractionDigits: 1 })}</strong><small>(${p.reviews} · ${state.lang === "de" ? "Demo" : "demo"})</small></span><span class="place-duration">${icon("clock")}${p.duration[state.lang]}</span></div></div></article>`;
}
function renderPlaces() {
  const filtered = getFilteredPlaces();
  const visible = state.all ? filtered : filtered.slice(0, 6);
  $("#place-grid").innerHTML = visible.length
    ? visible.map(placeCard).join("")
    : `<div class="empty-state"><span class="empty-icon">✳</span><h3>${t("noResultsTitle")}</h3><p>${t("noResultsText")}</p><button data-reset class="button button-primary">${t("resetFilters")}</button></div>`;
  $("#results-count").innerHTML = t("results", {
    shown: `<strong>${visible.length}</strong>`,
    total: filtered.length,
  });
  $("#show-more").hidden = filtered.length <= visible.length;
  const active = $("#active-filters");
  active.hidden = !state.city;
  active.innerHTML = state.city
    ? `<button class="active-filter" data-clear-city aria-label="${esc(t("removeFilter"))}">${cityName(state.city)} ×</button>`
    : "";
}
function resetFilters() {
  state.category = "all";
  state.city = "";
  state.query = "";
  state.all = false;
  $("#catalog-search").value = "";
  $("#destination-search").value = "";
  $("#hero-interest").value = "all";
  renderFilters();
  renderPlaces();
}
function renderExperiences() {
  const visible = state.experiencesExpanded
    ? experiences
    : experiences.slice(0, 3);
  $("#experience-grid").innerHTML = visible
    .map(
      (e) =>
        `<button class="experience-card" data-experience="${e.id}"><div class="experience-image">${photoTag(e)}<span class="experience-tag">${t("selfGuided")}</span><span class="circle-arrow" aria-hidden="true">↗</span></div><div class="experience-meta"><span>${cityName(e.city)}</span><span>${e.duration[state.lang]}</span></div><h3>${e.title[state.lang]}</h3><p>${e.description[state.lang]}</p></button>`,
    )
    .join("");
  updateCollectionToggle(
    "#experience-more",
    state.experiencesExpanded,
    experiences,
    3,
    "showAllExperiences",
    "showFewerExperiences",
  );
}
function renderGallery() {
  $("#gallery-grid").innerHTML = gallery
    .map(
      (g, i) =>
        `<button class="gallery-item" data-photo="${i}" aria-label="${esc(`${loc(g.location)} ${t("galleryPhoto")}: ${g.alt[state.lang]}`)}">${photoTag(g)}<span>${loc(g.location)}${icon("expand")}</span></button>`,
    )
    .join("");
}
function renderMapCities() {
  $("#map-cities").innerHTML = destinations
    .map(
      (d) =>
        `<button class="map-city ${state.mapCity === d.city ? "active" : ""}" data-map-city="${d.id}" aria-pressed="${state.mapCity === d.city}"><span>${cityName(d.city)}<small>${d.country[state.lang]}</small></span>${icon("pin")}</button>`,
    )
    .join("");
}
const faqs = {
  en: [
    [
      "What exactly is Wayfarer?",
      "Wayfarer is a travel guide portfolio concept: a small, thoughtfully curated collection of real places and self-guided experiences. The interface is fully functional, while traveler stories, ratings and review counts are illustrative demo content.",
    ],
    [
      "Can I book an experience here?",
      "These are ideas for exploring independently, rather than bookable tours. Nothing is charged and no reservation is made. Check official venue websites for current access, opening hours and tickets before visiting.",
    ],
    [
      "How do saved places work?",
      "Tap the heart on any place to add it to your collection. Your collection stays in this browser on this device, with no account needed. Open Saved to revisit places or download a copy of your list.",
    ],
    [
      "Is the guide available offline?",
      "Saved places and preferences are stored locally, but the page still needs an internet connection to load. Map imagery is provided by OpenStreetMap. If tiles are unavailable, you can still explore the place details.",
    ],
    [
      "What happens when I use the contact form?",
      "The form validates your message and prepares a text file you can download. Your details never leave the browser and no email is sent. You can clear stored theme, language and favorites using Privacy & local data.",
    ],
  ],
  de: [
    [
      "Was genau ist Wayfarer?",
      "Wayfarer ist ein Reiseguide als Portfolio-Konzept: eine kleine, sorgfältig ausgewählte Sammlung realer Orte und Erlebnisse auf eigene Faust. Die Oberfläche ist voll funktionsfähig; Reisegeschichten, Bewertungen und Bewertungszahlen sind illustrative Demoinhalte.",
    ],
    [
      "Kann ich hier ein Erlebnis buchen?",
      "Die Erlebnisse sind Ideen zum eigenständigen Entdecken, keine buchbaren Touren. Es entstehen keine Kosten und keine Reservierung. Prüfe vor deinem Besuch die offiziellen Websites für aktuelle Zugangsregeln, Öffnungszeiten und Tickets.",
    ],
    [
      "Wie funktionieren gespeicherte Orte?",
      "Tippe auf das Herz eines Ortes, um ihn deiner Sammlung hinzuzufügen. Sie bleibt in diesem Browser auf diesem Gerät – ganz ohne Konto. Unter „Merkliste“ kannst du Orte wiederfinden und deine Liste herunterladen.",
    ],
    [
      "Ist der Guide offline verfügbar?",
      "Gespeicherte Orte und Einstellungen werden lokal abgelegt. Zum Laden der Seite brauchst du weiterhin eine Internetverbindung. Das Kartenbild stammt von OpenStreetMap. Falls es nicht verfügbar ist, kannst du die Ortsdetails trotzdem entdecken.",
    ],
    [
      "Was passiert mit dem Kontaktformular?",
      "Das Formular prüft deine Nachricht und bereitet eine Textdatei zum Herunterladen vor. Deine Angaben verlassen den Browser nicht und es wird keine E-Mail gesendet. Unter „Datenschutz & lokale Daten“ kannst du Design, Sprache und gespeicherte Orte zurücksetzen.",
    ],
  ],
};
const faqAnimations = new WeakMap();
function renderFaq() {
  const items = $$("#faq-list details");
  const opened = items.findIndex((item) => item.dataset.expanded === "true");
  items.forEach((item) => faqAnimations.get(item)?.cancel());
  $("#faq-list").innerHTML = faqs[state.lang]
    .map(
      ([q, a], i) =>
        `<details data-expanded="${opened === i}" ${opened === i ? "open" : ""}><summary aria-expanded="${opened === i}">${q}</summary><p>${a}</p></details>`,
    )
    .join("");
}
function setFaqExpanded(item, expanded) {
  const startHeight = item.getBoundingClientRect().height;
  faqAnimations.get(item)?.cancel();
  faqAnimations.delete(item);
  item.dataset.expanded = String(expanded);
  $("summary", item).setAttribute("aria-expanded", String(expanded));
  item.style.height = "";
  item.style.overflow = "";

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    item.open = expanded;
    return;
  }

  // Keep the answer rendered until the closing animation has finished.
  item.open = true;
  const endHeight =
    item.getBoundingClientRect().height -
    (expanded ? 0 : $("p", item).getBoundingClientRect().height);
  item.style.height = `${startHeight}px`;
  item.style.overflow = "hidden";
  const animation = item.animate(
    { height: [`${startHeight}px`, `${endHeight}px`] },
    { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  faqAnimations.set(item, animation);
  animation.onfinish = () => {
    item.open = expanded;
    item.style.height = "";
    item.style.overflow = "";
    faqAnimations.delete(item);
  };
}
$("#faq-list").addEventListener("click", (event) => {
  const summary = event.target.closest("summary");
  if (!summary) return;
  event.preventDefault();
  const item = summary.closest("details");
  const expanded = item.dataset.expanded !== "true";
  if (expanded) {
    $$('#faq-list details[data-expanded="true"]').forEach((other) => {
      if (other !== item) setFaqExpanded(other, false);
    });
  }
  setFaqExpanded(item, expanded);
});
function showDetails(id, experienceId = null) {
  const p = places.find((item) => item.id === id);
  if (!p) return;
  state.detail = { id, experienceId };
  renderDetail();
  openModal($("#detail-dialog"));
}
function renderDetail() {
  if (!state.detail) return;
  const p = places.find((item) => item.id === state.detail.id);
  const e = experiences.find((item) => item.id === state.detail.experienceId);
  const saved = savedIds.has(p.id);
  $("#detail-content").innerHTML =
    `${photoTag(e || p, "detail-image")}<div class="detail-body"><span class="eyebrow">${cityName(p.city)} · ${p.country[state.lang]} · ${t(p.category)}</span><h2 id="detail-title">${e ? e.title[state.lang] : p.name[state.lang]}</h2><div class="detail-info"><span>${icon("clock")}${e ? e.duration[state.lang] : p.duration[state.lang]}</span><span>${icon("star")}${p.rating.toLocaleString(state.lang, { minimumFractionDigits: 1 })} · ${state.lang === "de" ? "Demobewertung" : "demo rating"}</span></div><p>${e ? e.description[state.lang] + " " : ""}${p.description[state.lang]}</p><div class="detail-tip"><strong>${t("localTip")}</strong>${p.tip[state.lang]}</div><div class="detail-actions"><button class="button button-primary detail-save ${saved ? "is-saved" : ""}" data-save="${p.id}" aria-pressed="${saved}" aria-label="${esc(`${t(saved ? "unsavePlace" : "savePlace")}: ${p.name[state.lang]}`)}">${icon("heart")}${t(saved ? "unsavePlace" : "savePlace")}</button><button class="button button-outline" data-detail-map="${p.id}">${icon("map")}${t("seeOnMap")}</button><a class="button button-outline" href="https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}" target="_blank" rel="noopener noreferrer">${t("openStreetMap")} ↗</a></div><div class="detail-demo">${t("demoRatings")}</div></div>`;
  $("#detail-dialog").setAttribute("aria-labelledby", "detail-title");
}
function renderSaved() {
  const saved = places.filter((p) => savedIds.has(p.id));
  $("#saved-content").innerHTML = saved.length
    ? `<div class="saved-list">${saved.map((p) => `<article class="saved-item">${photoTag(p)}<div><h3>${p.name[state.lang]}</h3><p>${cityName(p.city)}, ${p.country[state.lang]} · ${t(p.category)}</p><button class="text-link" data-saved-detail="${p.id}">${t("viewDetails")} ↗</button></div><button class="icon-button" data-save="${p.id}" aria-label="${esc(`${t("removeSaved")}: ${p.name[state.lang]}`)}">${icon("trash")}</button></article>`).join("")}</div><div class="saved-bottom"><button class="button button-outline" id="clear-saved">${t("clearSaved")}</button><button class="button button-primary" id="export-saved">${icon("download")}${t("exportSaved")}</button></div>`
    : `<div class="empty-state"><span class="empty-icon">♡</span><h3>${t("noSavedTitle")}</h3><p>${t("noSavedText")}</p><button class="button button-primary" id="saved-explore">${t("explorePlaces")} ↗</button></div>`;
}
function updateLightbox() {
  const g = gallery[state.photo];
  $("#lightbox-image").src = g.image;
  $("#lightbox-image").alt = g.alt[state.lang];
  $("#lightbox-caption").textContent =
    `${loc(g.location)} — ${g.alt[state.lang]}`;
  $("#lightbox-counter").textContent =
    `0${state.photo + 1} / 0${gallery.length}`;
}
function movePhoto(direction) {
  state.photo = (state.photo + direction + gallery.length) % gallery.length;
  updateLightbox();
}
function applyTheme() {
  const effective =
    state.theme === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : state.theme;
  document.documentElement.dataset.theme = effective;
  $("#theme-button").innerHTML = icon(
    state.theme === "system"
      ? "monitor"
      : state.theme === "dark"
        ? "moon"
        : "sun",
  );
  $$("[data-theme-choice]").forEach((btn) =>
    btn.setAttribute(
      "aria-pressed",
      String(btn.dataset.themeChoice === state.theme),
    ),
  );
  $('meta[name="theme-color"]').content =
    effective === "dark" ? "#151e1a" : "#faf9f6";
}
function translateStatic() {
  document.documentElement.lang = state.lang;
  $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $$("[data-i18n-html]").forEach(
    (el) => (el.innerHTML = t(el.dataset.i18nHtml)),
  );
  $$("[data-i18n-placeholder]").forEach(
    (el) => (el.placeholder = t(el.dataset.i18nPlaceholder)),
  );
  $("#language-label").textContent = state.lang.toUpperCase();
  const labels = {
    "#language-button": state.lang.toUpperCase() + " " + t("switchLanguage"),
    "#theme-button": t("themeLabel"),
    "#menu-toggle": t($("#mobile-nav").hidden ? "openMenu" : "closeMenu"),
    "#catalog-search":
      state.lang === "de" ? "Orte durchsuchen" : "Search places",
    "#filter-tabs":
      state.lang === "de" ? "Nach Kategorie filtern" : "Filter by category",
    "#travel-map":
      state.lang === "de"
        ? "Interaktive Karte mit ausgewählten Orten"
        : "Interactive map of curated places",
    "#back-top": t("backTop"),
    "#lightbox-prev": t("previousPhoto"),
    "#lightbox-next": t("nextPhoto"),
    "#share-site": state.lang === "de" ? "Wayfarer teilen" : "Share Wayfarer",
  };
  Object.entries(labels).forEach(([s, label]) =>
    $(s).setAttribute("aria-label", label),
  );
  $$("[data-close]").forEach((btn) =>
    btn.setAttribute("aria-label", t("closeDialog")),
  );
  $(".hero-footnote>a").setAttribute("aria-label", t("navDestinations"));
  $(".hero-image").alt =
    state.lang === "de"
      ? "Farbenfrohes Küstendorf über dem türkisblauen Mittelmeer in den Cinque Terre, Italien"
      : "Colorful coastal village above the turquoise Mediterranean Sea in Cinque Terre, Italy";
  $(".desktop-nav").setAttribute(
    "aria-label",
    state.lang === "de" ? "Hauptnavigation" : "Main navigation",
  );
  $("#mobile-nav").setAttribute(
    "aria-label",
    state.lang === "de" ? "Mobile Navigation" : "Mobile navigation",
  );
  $$(".brand").forEach((a) =>
    a.setAttribute(
      "aria-label",
      state.lang === "de" ? "Wayfarer Startseite" : "Wayfarer home",
    ),
  );
  $(".social-links a").setAttribute(
    "aria-label",
    state.lang === "de"
      ? "Städtereise-Inspiration auf Instagram"
      : "City guide inspiration on Instagram",
  );
  $(".social-links a:nth-child(2)").setAttribute(
    "aria-label",
    state.lang === "de"
      ? "Städtereise-Inspiration auf Pinterest"
      : "City guide inspiration on Pinterest",
  );
  document.title =
    state.lang === "de"
      ? "Wayfarer — Eine Welt voller Entdeckungen"
      : "Wayfarer — A world worth wandering";
  const description =
    state.lang === "de"
      ? "Ein wenig Neugier, eine Welt voller Möglichkeiten. Entdecke ausgewählte Stadtguides, besondere Orte und kleine Abenteuer mit Wayfarer."
      : "A little curiosity, a world of possibilities. Discover thoughtful city guides, beautiful places and everyday adventures with Wayfarer.";
  $('meta[name="description"]').content = description;
  $('meta[property="og:title"]').content = document.title;
  $('meta[property="og:description"]').content = description;
}
function renderAll() {
  translateStatic();
  renderDestinations();
  renderFilters();
  renderPlaces();
  renderExperiences();
  renderGallery();
  renderMapCities();
  renderFaq();
  updateSavedCount();
  applyTheme();
  mapController?.setLanguage(state.lang);
  if ($("#detail-dialog").open) renderDetail();
  if ($("#saved-dialog").open) renderSaved();
  if ($("#lightbox").open) updateLightbox();
  if ($("#info-dialog").open) showInfo($("#info-dialog").dataset.kind, false);
  if (attemptedSubmit) validateForm(false);
  if (draft) renderDraftResult();
}
function setMenu(open) {
  $("#mobile-nav").hidden = !open;
  $("#menu-toggle").setAttribute("aria-expanded", String(open));
  $("#menu-toggle").setAttribute(
    "aria-label",
    t(open ? "closeMenu" : "openMenu"),
  );
  $("#menu-toggle").innerHTML = icon(open ? "close" : "menu");
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".theme-picker")) {
    $("#theme-menu").hidden = true;
    $("#theme-button").setAttribute("aria-expanded", "false");
  }
  const target = event.target.closest("button,a");
  if (!target) return;
  if (target.dataset.save) toggleSaved(target.dataset.save);
  if (target.dataset.detail) showDetails(target.dataset.detail);
  if (target.id === "destination-more") {
    state.destinationsExpanded = !state.destinationsExpanded;
    renderDestinations();
  }
  if (target.id === "experience-more") {
    state.experiencesExpanded = !state.experiencesExpanded;
    renderExperiences();
  }
  if (target.dataset.city) {
    const d = destinations.find((d) => d.id === target.dataset.city);
    state.city = d.city;
    state.category = "all";
    state.query = "";
    state.all = false;
    $("#catalog-search").value = "";
    renderFilters();
    renderPlaces();
    goTo("#explore");
  }
  if (target.hasAttribute("data-filter")) {
    state.category = target.dataset.filter;
    state.all = false;
    renderFilters();
    renderPlaces();
    $("#filter-tabs")
      .querySelector(`[data-filter="${state.category}"]`)
      ?.focus({ preventScroll: true });
  }
  if (target.hasAttribute("data-reset")) {
    resetFilters();
    $("#catalog-search").focus({ preventScroll: true });
  }
  if (target.hasAttribute("data-clear-city")) {
    state.city = "";
    renderPlaces();
    $("#catalog-search").focus({ preventScroll: true });
  }
  if (target.dataset.experience) {
    const e = experiences.find((e) => e.id === target.dataset.experience);
    showDetails(e.placeId, e.id);
  }
  if (target.hasAttribute("data-photo")) {
    state.photo = Number(target.dataset.photo);
    updateLightbox();
    openModal($("#lightbox"));
  }
  if (target.dataset.mapCity) {
    const d = destinations.find((d) => d.id === target.dataset.mapCity);
    state.mapCity = d.city;
    renderMapCities();
    state.mapPlaceId = places.find((p) => p.city === d.city).id;
    mapController?.selectPlace(state.mapPlaceId);
    $("#map-cities")
      .querySelector('[data-map-city="' + d.id + '"]')
      ?.focus({ preventScroll: true });
  }
  if (target.hasAttribute("data-close")) target.closest("dialog").close();
  if (target.dataset.detailMap) {
    const p = places.find((p) => p.id === target.dataset.detailMap);
    $("#detail-dialog").close();
    state.mapCity = p.city;
    renderMapCities();
    state.mapPlaceId = p.id;
    goTo("#map");
    mapController?.selectPlace(p.id);
  }
  if (target.dataset.savedDetail) {
    $("#saved-dialog").close();
    showDetails(target.dataset.savedDetail);
  }
  if (target.id === "saved-explore") {
    $("#saved-dialog").close();
    goTo("#explore");
  }
  if (target.id === "clear-saved") {
    savedIds.clear();
    persist("saved", "[]");
    updateSavedCount();
    renderPlaces();
    renderSaved();
    $("#saved-explore")?.focus({ preventScroll: true });
  }
  if (target.id === "export-saved") {
    download(
      "wayfarer-saved-places.json",
      JSON.stringify(
        {
          guide: "Wayfarer",
          language: state.lang,
          places: places
            .filter((p) => savedIds.has(p.id))
            .map((p) => ({
              name: p.name[state.lang],
              city: cityName(p.city),
              category: t(p.category),
              notes: p.tip[state.lang],
              coordinates: { lat: p.lat, lng: p.lng },
              map: `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`,
            })),
        },
        null,
        2,
      ),
      "application/json",
    );
    toast(t("savedExported"));
  }
  if (target.dataset.themeChoice) {
    state.theme = target.dataset.themeChoice;
    persist("theme", state.theme);
    applyTheme();
    $("#theme-menu").hidden = true;
    $("#theme-button").setAttribute("aria-expanded", "false");
    $("#theme-button").focus();
  }
  if (target.closest("#mobile-nav") && target.tagName === "A") setMenu(false);
  if (!target.closest(".theme-picker")) {
    $("#theme-menu").hidden = true;
    $("#theme-button").setAttribute("aria-expanded", "false");
  }
});
$("#hero-search").addEventListener("submit", (event) => {
  event.preventDefault();
  state.query = $("#destination-search").value.trim();
  state.category = $("#hero-interest").value;
  state.city = "";
  state.all = false;
  $("#catalog-search").value = state.query;
  renderFilters();
  renderPlaces();
  goTo("#explore");
  setTimeout(
    () => $("#catalog-search").focus({ preventScroll: true }),
    matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450,
  );
});
$("#catalog-search").addEventListener("input", (event) => {
  state.query = event.target.value;
  state.all = false;
  renderPlaces();
});
$("#sort-select").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderPlaces();
});
$("#show-more").addEventListener("click", () => {
  state.all = true;
  renderPlaces();
  $("#place-grid .place-card:nth-child(7) .place-title-button")?.focus({
    preventScroll: true,
  });
});
let isSwitchingLanguage = false;
$("#language-button").addEventListener("click", async () => {
  if (isSwitchingLanguage) return;
  const update = () => {
    state.lang = state.lang === "en" ? "de" : "en";
    persist("lang", state.lang);
    renderAll();
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }

  isSwitchingLanguage = true;
  let fadeOut;
  try {
    if (document.startViewTransition) {
      await document.startViewTransition(update).finished;
    } else {
      fadeOut = document.body.animate(
        { opacity: [1, 0] },
        { duration: 100, easing: "ease-out", fill: "forwards" },
      );
      await fadeOut.finished;
      update();
      fadeOut.cancel();
      await document.body.animate(
        { opacity: [0, 1] },
        { duration: 180, easing: "ease-in" },
      ).finished;
    }
  } finally {
    fadeOut?.cancel();
    isSwitchingLanguage = false;
  }
});
$("#theme-button").addEventListener("click", () => {
  const open = $("#theme-menu").hidden;
  $("#theme-menu").hidden = !open;
  $("#theme-button").setAttribute("aria-expanded", String(open));
  if (open) $('#theme-menu button[aria-pressed="true"]').focus();
});
$("#menu-toggle").addEventListener("click", () =>
  setMenu($("#mobile-nav").hidden),
);
$("#mobile-nav").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
    $("#menu-toggle").focus();
  }
});
$("#theme-menu").addEventListener("keydown", (event) => {
  const choices = $$("button", $("#theme-menu"));
  const index = choices.indexOf(document.activeElement);
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    choices[
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? 2
          : (index + (event.key === "ArrowDown" ? 1 : 2)) % 3
    ].focus();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!$("#theme-menu").hidden) {
      $("#theme-menu").hidden = true;
      $("#theme-button").setAttribute("aria-expanded", "false");
      $("#theme-button").focus();
    }
    if (!$("#mobile-nav").hidden) {
      setMenu(false);
      $("#menu-toggle").focus();
    }
  }
  if ($("#lightbox").open && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    movePhoto(event.key === "ArrowRight" ? 1 : -1);
  }
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (state.theme === "system") applyTheme();
});
matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});
$("#saved-button").addEventListener("click", () => {
  renderSaved();
  openModal($("#saved-dialog"));
});
$("#map-jump").addEventListener("click", () => goTo("#map"));
$("#lightbox-prev").addEventListener("click", () => movePhoto(-1));
$("#lightbox-next").addEventListener("click", () => movePhoto(1));
$$("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    if (!$$("dialog[open]").length) {
      document.body.classList.remove("modal-open");
      if (
        modalTrigger?.isConnected &&
        (!modalTrigger.closest("dialog") || modalTrigger.closest("dialog").open)
      )
        modalTrigger.focus({ preventScroll: true });
      else $("#saved-button").focus({ preventScroll: true });
    }
  });
});
$("#back-top").addEventListener("click", () => {
  goTo("#home");
  $(".brand").focus({ preventScroll: true });
});
function onScroll() {
  const scrolled = scrollY > 20;
  $(".site-header").classList.toggle("scrolled", scrolled);
  $("#back-top").hidden = scrollY < 650;
}
window.addEventListener("scroll", onScroll, { passive: true });

function download(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function validateForm(focus = true) {
  const checks = [
    ["name", $("#contact-name").value.trim().length >= 2, "nameError"],
    [
      "email",
      $("#contact-email").value.trim() !== "" &&
        $("#contact-email").validity.valid,
      "emailError",
    ],
    [
      "message",
      $("#contact-message").value.trim().length >= 15,
      "messageError",
    ],
    ["consent", $("#contact-consent").checked, "consentError"],
  ];
  checks.forEach(([field, valid, key]) => {
    const input = $(`#contact-${field}`);
    input.setAttribute("aria-invalid", String(!valid));
    $(`#${field}-error`).textContent = valid ? "" : t(key);
  });
  const invalid = checks.find(([, valid]) => !valid);
  if (invalid && focus) $(`#contact-${invalid[0]}`).focus();
  return !invalid;
}
function renderDraftResult() {
  const result = $("#form-result");
  result.hidden = false;
  result.innerHTML = `<strong>${t("draftTitle")}</strong><p>${t("draftText")}</p><button type="button" id="download-draft">${t("downloadDraft")} ↓</button>`;
}
$("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  attemptedSubmit = true;
  if (!validateForm()) return;
  draft = {
    name: $("#contact-name").value.trim(),
    email: $("#contact-email").value.trim(),
    topic: $("#contact-topic").value,
    message: $("#contact-message").value.trim(),
  };
  renderDraftResult();
  $("#form-result").setAttribute("tabindex", "-1");
  $("#form-result").focus();
});
$("#contact-form").addEventListener("input", () => {
  $("#message-count").textContent =
    `${$("#contact-message").value.length} / 2000`;
  if (draft) {
    draft = null;
    $("#form-result").hidden = true;
  }
  if (attemptedSubmit) validateForm(false);
});
$("#contact-form").addEventListener("change", () => {
  if (draft) {
    draft = null;
    $("#form-result").hidden = true;
  }
  if (attemptedSubmit) validateForm(false);
});
$("#form-result").addEventListener("click", (event) => {
  if (event.target.id !== "download-draft" || !draft) return;
  const topic = {
    recommendation: t("topicRecommendation"),
    question: t("topicQuestion"),
    feedback: t("topicFeedback"),
  }[draft.topic];
  const content = `WAYFARER — ${t("draftTitle")}\n${t("demoNotice")}\n\n${t("nameLabel")}: ${draft.name}\n${t("emailLabel")}: ${draft.email}\n${t("topicLabel")}: ${topic}\n\n${draft.message}\n`;
  download("wayfarer-message-draft.txt", content);
  toast(t("draftDownloaded"));
});

function showInfo(kind, open = true) {
  $("#info-dialog").dataset.kind = kind;
  const privacy = kind === "privacy";
  $("#info-content").innerHTML = privacy
    ? `<span class="eyebrow">WAYFARER</span><h2 id="info-title">${t("privacyTitle")}</h2><p>${t("privacyText")}</p><p>${t("privacyMap")}</p><button class="button button-outline" id="clear-local-data">${icon("trash")}${t("clearLocalData")}</button>`
    : `<span class="eyebrow">${state.lang === "de" ? "PORTFOLIO-KONZEPT" : "PORTFOLIO CONCEPT"}</span><h2 id="info-title">${t("creditsTitle")}</h2><p>${t("creditsText")}</p><p>${t("creditsImages")} <a href="./credits.json" target="_blank" rel="noopener noreferrer">${state.lang === "de" ? "Bildquellen" : "Photo sources"} ↗</a></p><p>${t("creditsFonts")} <a href="./licenses/fonts/manrope-OFL.txt" target="_blank" rel="noopener noreferrer">Manrope</a> · <a href="./licenses/fonts/cormorantgaramond-OFL.txt" target="_blank" rel="noopener noreferrer">Cormorant Garamond</a></p><p>${t("creditsMap")} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a></p>`;
  $("#info-dialog").setAttribute("aria-labelledby", "info-title");
  if (open) openModal($("#info-dialog"));
}
$("#privacy-button").addEventListener("click", () => showInfo("privacy"));
$("#credits-button").addEventListener("click", () => showInfo("credits"));
$("#info-content").addEventListener("click", (event) => {
  if (!event.target.closest("#clear-local-data")) return;
  try {
    ["saved", "theme", "lang"].forEach((key) =>
      localStorage.removeItem(`wayfarer-${key}`),
    );
  } catch {}
  savedIds.clear();
  state.theme = "system";
  const notice = t("dataCleared");
  state.lang = "en";
  $("#info-dialog").close();
  renderAll();
  toast(notice);
});
$("#share-site").addEventListener("click", async () => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: document.title,
        text:
          state.lang === "de"
            ? "Eine Welt voller Entdeckungen."
            : "A world worth wandering.",
        url: location.href.split("#")[0],
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(location.href.split("#")[0]);
      toast(t("shareCopied"));
    } else {
      throw new Error("Unavailable");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      const url = location.href.split("#")[0];
      $("#info-content").innerHTML =
        `<h2 id="info-title">${state.lang === "de" ? "Wayfarer teilen" : "Share Wayfarer"}</h2><p>${t("shareUnavailable")}</p><input aria-label="${state.lang === "de" ? "Link zum Kopieren" : "Link to copy"}" readonly value="${esc(url)}" style="width:100%;padding:12px;margin-top:15px">`;
      $("#info-dialog").dataset.kind = "share";
      $("#info-dialog").setAttribute("aria-labelledby", "info-title");
      openModal($("#info-dialog"));
      $("#info-content input").select();
    }
  }
});

renderAll();
setMenu(false);
onScroll();
const mapObserver = new IntersectionObserver(
  (entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      mapController = initMap({
        container: $("#travel-map"),
        places,
        lang: state.lang,
        onSelect: showDetails,
      });
      if (state.mapPlaceId) mapController.selectPlace(state.mapPlaceId);
      mapObserver.disconnect();
    }
  },
  { rootMargin: "600px" },
);
mapObserver.observe($("#map"));
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.08 },
);
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  $$(
    ".section-heading,.about-intro,.benefit-list,.faq-intro,.contact-intro",
  ).forEach((el) => {
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
}
