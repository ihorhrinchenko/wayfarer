const labels = {
  en: {
    map: "Interactive map of curated places",
    details: "Explore this place",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    close: "Close place preview",
    help: "Use the arrow keys to move the map and plus or minus to zoom. Tab to a pin and press Enter or Space to preview a place.",
    loading: "Finding your next favourite place…",
    unavailable: "The map is taking a little detour.",
    offline:
      "Map imagery is unavailable. Explore the places below or open their coordinates in OpenStreetMap.",
    open: "Open map",
    curated: "A few places worth finding",
    at: "in",
  },
  de: {
    map: "Interaktive Karte mit ausgewählten Orten",
    details: "Diesen Ort entdecken",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    close: "Ortsvorschau schließen",
    help: "Verschiebe die Karte mit den Pfeiltasten und zoome mit Plus oder Minus. Wähle einen Marker mit Tab und öffne ihn mit Eingabe oder Leertaste.",
    loading: "Dein nächster Lieblingsort wird gesucht…",
    unavailable: "Die Karte macht einen kleinen Umweg.",
    offline:
      "Das Kartenbild ist gerade nicht verfügbar. Entdecke die Orte unten oder öffne ihre Koordinaten in OpenStreetMap.",
    open: "Karte öffnen",
    curated: "Orte, die einen Umweg wert sind",
    at: "in",
  },
};

const assetUrl = (file) => `${import.meta.env.BASE_URL}vendor/leaflet/${file}`;
let libraryPromise;
function loadLibrary() {
  if (window.L) return Promise.resolve(window.L);
  if (libraryPromise) return libraryPromise;
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = assetUrl("leaflet.css");
  document.head.append(css);
  libraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = setTimeout(
      () => reject(new Error("Map library timeout")),
      10000,
    );
    script.src = assetUrl("leaflet.js");
    script.onload = () => {
      clearTimeout(timeout);
      window.L ? resolve(window.L) : reject(new Error("Map library missing"));
    };
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Map library unavailable"));
    };
    document.head.append(script);
  });
  return libraryPromise;
}

function textFor(value, lang) {
  return typeof value === "object"
    ? value[lang] || value.en || ""
    : value || "";
}
function cityFor(city, lang) {
  return lang === "de"
    ? { Lisbon: "Lissabon", Copenhagen: "Kopenhagen", Florence: "Florenz" }[
        city
      ] || city
    : city;
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function initMap({
  container,
  places = [],
  lang = "en",
  onSelect = () => {},
}) {
  if (!container) return { setLanguage() {}, selectPlace() {}, destroy() {} };
  let language = labels[lang] ? lang : "en";
  const validPlaces = places.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng),
  );
  let activeId =
    validPlaces.find((p) => p.city?.toLowerCase().includes("lis"))?.id ||
    validPlaces[0]?.id;
  let map;
  let destroyed = false;
  let offlineMode = false;
  let loadedTiles = 0;
  let failedTiles = 0;
  let tileTimer;
  let resizeObserver;
  const markers = new Map();
  const shell = element("div", "wayfarer-map-shell");
  const canvas = element("div", "wayfarer-map-canvas");
  canvas.setAttribute("role", "region");
  canvas.setAttribute("aria-label", labels[language].map);
  const help = element("p", "wayfarer-map-help", labels[language].help);
  help.id = `${container.id || "travel-map"}-keyboard-help`;
  canvas.setAttribute("aria-describedby", help.id);
  const status = element(
    "div",
    "wayfarer-map-loading",
    labels[language].loading,
  );
  status.setAttribute("role", "status");
  const legend = element("div", "wayfarer-map-legend");
  legend.append(
    element("span", "wayfarer-map-legend-dot"),
    element("span", "wayfarer-map-legend-label", labels[language].curated),
  );
  shell.append(canvas, status, legend, help);
  container.replaceChildren(shell);

  function makePopup(place) {
    const popup = element("div", "wayfarer-map-popup");
    if (place.image) {
      const photo = element("img", "wayfarer-map-popup-photo");
      photo.src = place.image;
      photo.alt = textFor(place.alt, language) || textFor(place.name, language);
      photo.loading = "lazy";
      popup.append(photo);
    }
    const info = element("div", "wayfarer-map-popup-info");
    info.append(
      element("span", "wayfarer-map-popup-city", cityFor(place.city, language)),
      element("h3", "", textFor(place.name, language)),
    );
    const button = element(
      "button",
      "wayfarer-map-popup-button",
      `${labels[language].details} ↗`,
    );
    button.type = "button";
    button.addEventListener("click", () => onSelect(place.id));
    info.append(button);
    popup.append(info);
    return popup;
  }

  function displayFallback() {
    if (destroyed || offlineMode) return;
    offlineMode = true;
    status.remove();
    legend.hidden = true;
    const fallback = element("div", "wayfarer-map-fallback");
    fallback.append(
      element("span", "wayfarer-map-fallback-icon", "↗"),
      element("h3", "", labels[language].unavailable),
      element("p", "", labels[language].offline),
    );
    const list = element("div", "wayfarer-map-fallback-places");
    validPlaces.forEach((place) => {
      const row = element("div", "wayfarer-map-fallback-place");
      const button = element("button", "", textFor(place.name, language));
      button.type = "button";
      button.addEventListener("click", () => onSelect(place.id));
      const link = element("a", "", `${labels[language].open} ↗`);
      link.href = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute(
        "aria-label",
        `${labels[language].open}: ${textFor(place.name, language)}`,
      );
      row.append(button, link);
      list.append(row);
    });
    fallback.append(list);
    shell.append(fallback);
  }

  function updateMapLanguage() {
    canvas.setAttribute("aria-label", labels[language].map);
    help.textContent = labels[language].help;
    const attribution = canvas.querySelector(
      '.leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]',
    );
    if (attribution)
      attribution.textContent =
        language === "de"
          ? "OpenStreetMap-Mitwirkende"
          : "OpenStreetMap contributors";
    legend.querySelector(".wayfarer-map-legend-label").textContent =
      labels[language].curated;
    const zoomIn = canvas.querySelector(".leaflet-control-zoom-in");
    const zoomOut = canvas.querySelector(".leaflet-control-zoom-out");
    if (zoomIn) {
      zoomIn.title = labels[language].zoomIn;
      zoomIn.setAttribute("aria-label", labels[language].zoomIn);
    }
    if (zoomOut) {
      zoomOut.title = labels[language].zoomOut;
      zoomOut.setAttribute("aria-label", labels[language].zoomOut);
    }
    validPlaces.forEach((place) => {
      const marker = markers.get(place.id);
      if (!marker) return;
      marker.bindPopup(makePopup(place), {
        maxWidth: 250,
        minWidth: 210,
        className: "wayfarer-leaflet-popup",
        closeButton: true,
      });
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.title = `${textFor(place.name, language)}, ${cityFor(place.city, language)}`;
        markerElement.setAttribute(
          "aria-label",
          `${String(validPlaces.indexOf(place) + 1).padStart(2, "0")} ${textFor(place.name, language)}, ${cityFor(place.city, language)}`,
        );
      }
    });
    if (offlineMode) {
      shell.querySelector(".wayfarer-map-fallback")?.remove();
      offlineMode = false;
      displayFallback();
    }
  }

  function select(id) {
    const place = validPlaces.find((p) => p.id === id);
    if (!place) return;
    activeId = id;
    markers.forEach((marker, key) =>
      marker.getElement()?.classList.toggle("is-selected", key === id),
    );
    if (!map || destroyed || offlineMode) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    map.setView([place.lat, place.lng], Math.max(map.getZoom(), 13), {
      animate: !reduced,
    });
    markers.get(id)?.openPopup();
  }

  loadLibrary()
    .then((L) => {
      if (destroyed) return;
      const initial = validPlaces.find((p) => p.id === activeId);
      map = L.map(canvas, {
        center: initial ? [initial.lat, initial.lng] : [38.72, -9.13],
        zoom: 13,
        minZoom: 3,
        maxZoom: 18,
        scrollWheelZoom: false,
        zoomControl: false,
        keyboard: true,
      });
      map.on("popupopen", () => {
        const close = canvas.querySelector(".leaflet-popup-close-button");
        if (close) {
          close.title = labels[language].close;
          close.setAttribute("aria-label", labels[language].close);
        }
      });
      L.control
        .zoom({
          position: "bottomright",
          zoomInTitle: labels[language].zoomIn,
          zoomOutTitle: labels[language].zoomOut,
        })
        .addTo(map);
      const tiles = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
          maxZoom: 19,
        },
      ).addTo(map);
      tiles.on("tileload", () => {
        loadedTiles++;
        status.remove();
        clearTimeout(tileTimer);
      });
      tiles.on("tileerror", () => {
        failedTiles++;
        if (!loadedTiles && failedTiles > 5) displayFallback();
      });
      tileTimer = setTimeout(() => {
        if (!loadedTiles) displayFallback();
      }, 14000);
      validPlaces.forEach((place, index) => {
        const marker = L.marker([place.lat, place.lng], {
          icon: L.divIcon({
            className: "wayfarer-map-marker",
            html: `<span>${String(index + 1).padStart(2, "0")}</span>`,
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -42],
          }),
          title: `${textFor(place.name, language)}, ${cityFor(place.city, language)}`,
          keyboard: true,
          riseOnHover: true,
        }).addTo(map);
        marker.on("click", () => {
          activeId = place.id;
          markers.forEach((other, id) =>
            other
              .getElement()
              ?.classList.toggle("is-selected", id === place.id),
          );
        });
        marker.getElement()?.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          marker.fire("click");
          requestAnimationFrame(() =>
            marker
              .getPopup()
              ?.getElement()
              ?.querySelector(".wayfarer-map-popup-button")
              ?.focus(),
          );
        });
        markers.set(place.id, marker);
      });
      updateMapLanguage();
      resizeObserver = new ResizeObserver(() =>
        map?.invalidateSize({ animate: false }),
      );
      resizeObserver.observe(container);
      markers.get(activeId)?.getElement()?.classList.add("is-selected");
    })
    .catch(displayFallback);

  return {
    setLanguage(next) {
      language = labels[next] ? next : "en";
      status.textContent = labels[language].loading;
      updateMapLanguage();
    },
    selectPlace: select,
    destroy() {
      destroyed = true;
      clearTimeout(tileTimer);
      resizeObserver?.disconnect();
      map?.remove();
      container.replaceChildren();
    },
  };
}
