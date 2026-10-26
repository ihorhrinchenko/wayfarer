import alfamaImage from "../images/alfama.webp";
import bambooImage from "../images/bamboo.webp";
import coastImage from "../images/coast.webp";
import coffeeImage from "../images/coffee.webp";
import copenhagenImage from "../images/copenhagen.webp";
import florenceImage from "../images/florence.webp";
import heroImage from "../images/hero.webp";
import kyotoImage from "../images/kyoto.webp";
import lisbonImage from "../images/lisbon.webp";
import pastaImage from "../images/pasta.webp";

export const destinations = [
  {
    id: "lisbon",
    city: "Lisbon",
    country: { en: "Portugal", de: "Portugal" },
    description: {
      en: "Golden light. Winding streets. A slower kind of day.",
      de: "Goldenes Licht. Kleine Gassen. Ein Tag in deinem Tempo.",
    },
    image: lisbonImage,
    alt: {
      en: "A yellow tram on a cobblestone street in Lisbon",
      de: "Eine gelbe Straßenbahn in einer gepflasterten Gasse Lissabons",
    },
    count: 2,
    lat: 38.7223,
    lng: -9.1393,
  },
  {
    id: "copenhagen",
    city: "Copenhagen",
    country: { en: "Denmark", de: "Dänemark" },
    description: {
      en: "Harbour mornings and beautifully simple living.",
      de: "Morgenstunden am Hafen und die Kunst des einfachen Lebens.",
    },
    image: copenhagenImage,
    alt: {
      en: "Colourful houses beside the Nyhavn canal in Copenhagen",
      de: "Bunte Häuser am Nyhavn-Kanal in Kopenhagen",
    },
    count: 2,
    lat: 55.6761,
    lng: 12.5683,
  },
  {
    id: "kyoto",
    city: "Kyoto",
    country: { en: "Japan", de: "Japan" },
    description: {
      en: "Quiet rituals and a thousand shades of green.",
      de: "Stille Rituale und tausend Facetten von Grün.",
    },
    image: kyotoImage,
    alt: {
      en: "Traditional Kyoto street leading to Yasaka Pagoda at dusk",
      de: "Traditionelle Straße in Kyoto mit Blick auf die Yasaka-Pagode",
    },
    count: 2,
    lat: 35.0116,
    lng: 135.7681,
  },
  {
    id: "florence",
    city: "Florence",
    country: { en: "Italy", de: "Italien" },
    description: {
      en: "Renaissance beauty, best enjoyed without a plan.",
      de: "Renaissance-Schönheit, am besten ganz ohne festen Plan.",
    },
    image: florenceImage,
    alt: {
      en: "Florence rooftops and the dome of Santa Maria del Fiore",
      de: "Die Dächer von Florenz und die Kuppel von Santa Maria del Fiore",
    },
    count: 2,
    lat: 43.7696,
    lng: 11.2558,
  },
];

export const places = [
  {
    id: "praca-comercio",
    name: { en: "Praça do Comércio", de: "Praça do Comércio" },
    city: "Lisbon",
    country: { en: "Portugal", de: "Portugal" },
    category: "culture",
    description: {
      en: "Arcades, warm yellow façades and a wide-open view of the Tagus. Start at the river steps, wander beneath the monumental arch, then take the side streets into Baixa.",
      de: "Arkaden, warme gelbe Fassaden und ein weiter Blick auf den Tejo. Beginne an den Stufen am Fluss, gehe durch den Triumphbogen und entdecke die Seitenstraßen der Baixa.",
    },
    tip: {
      en: "Arrive in the early morning for softer light and quieter arcades. The square is public; the arch viewpoint may require a ticket.",
      de: "Am frühen Morgen sind das Licht weicher und die Arkaden ruhiger. Der Platz ist öffentlich; für den Aussichtspunkt im Bogen kann ein Ticket nötig sein.",
    },
    duration: { en: "1–2 hours", de: "1–2 Stunden" },
    image: alfamaImage,
    alt: {
      en: "The triumphal arch and yellow arcades of Praça do Comércio",
      de: "Der Triumphbogen und die gelben Arkaden am Praça do Comércio",
    },
    lat: 38.7079,
    lng: -9.1366,
    rating: 4.8,
    reviews: 128,
    tags: ["architecture", "riverside"],
  },
  {
    id: "tram-walk",
    name: {
      en: "Lisbon’s tram-lined lanes",
      de: "Lissabons Straßenbahngassen",
    },
    city: "Lisbon",
    country: { en: "Portugal", de: "Portugal" },
    category: "hidden",
    description: {
      en: "Follow the rhythm of a yellow tram through cobbled lanes and tiled façades. Make this a gentle self-guided walk, with plenty of pauses for a pastel de nata.",
      de: "Folge dem Rhythmus einer gelben Straßenbahn durch Kopfsteinpflastergassen und vorbei an Kachelfassaden. Ein entspannter Spaziergang mit vielen Pausen für ein Pastel de Nata.",
    },
    tip: {
      en: "Wear shoes with good grip: the steep cobbles can be slippery. Keep tram tracks clear and respect residential doorways.",
      de: "Trage Schuhe mit gutem Profil: Das steile Pflaster kann glatt sein. Halte die Gleise frei und respektiere Hauseingänge.",
    },
    duration: { en: "2 hours", de: "2 Stunden" },
    image: lisbonImage,
    alt: {
      en: "A vintage yellow tram in a narrow Lisbon street",
      de: "Eine historische gelbe Straßenbahn in einer engen Gasse Lissabons",
    },
    lat: 38.7139,
    lng: -9.1457,
    rating: 4.7,
    reviews: 96,
    tags: ["walking", "neighbourhoods"],
  },
  {
    id: "nyhavn",
    name: { en: "Nyhavn, the quiet way", de: "Nyhavn ganz entspannt" },
    city: "Copenhagen",
    country: { en: "Denmark", de: "Dänemark" },
    category: "culture",
    description: {
      en: "Pastel townhouses, wooden boats and a harbour with stories to tell. Wander the sunny quayside, then follow the water towards the city’s quieter bridges.",
      de: "Pastellfarbene Häuser, Holzboote und ein Hafen voller Geschichten. Schlendere am sonnigen Kai entlang und folge dem Wasser zu den ruhigeren Brücken der Stadt.",
    },
    tip: {
      en: "Go before the lunch rush and bring your own coffee for a simple harbour-side pause.",
      de: "Komm vor dem Mittagsandrang und bring einen Kaffee für eine kleine Pause am Hafen mit.",
    },
    duration: { en: "1 hour", de: "1 Stunde" },
    image: copenhagenImage,
    alt: {
      en: "Colourful Nyhavn buildings reflected in the canal",
      de: "Bunte Nyhavn-Häuser spiegeln sich im Kanal",
    },
    lat: 55.6799,
    lng: 12.5905,
    rating: 4.8,
    reviews: 143,
    tags: ["harbour", "architecture"],
  },
  {
    id: "copenhagen-coffee",
    name: {
      en: "A Copenhagen coffee morning",
      de: "Ein Kaffeemorgen in Kopenhagen",
    },
    city: "Copenhagen",
    country: { en: "Denmark", de: "Dänemark" },
    category: "food",
    description: {
      en: "A slow morning in Nørrebro: independently roasted coffee, a cardamom bun and a window seat. This neighbourhood route leaves room for whatever catches your eye.",
      de: "Ein ruhiger Morgen in Nørrebro: unabhängig gerösteter Kaffee, eine Kardamomschnecke und ein Fensterplatz. Diese Viertelrunde lässt Raum für spontane Entdeckungen.",
    },
    tip: {
      en: "Explore on foot and check individual cafés for current opening times. The photo illustrates the coffee experience.",
      de: "Erkunde das Viertel zu Fuß und prüfe die aktuellen Öffnungszeiten der Cafés. Das Foto illustriert das Kaffeeerlebnis.",
    },
    duration: { en: "1–2 hours", de: "1–2 Stunden" },
    image: coffeeImage,
    alt: {
      en: "A barista preparing a hand-poured filter coffee",
      de: "Ein Barista bereitet handaufgegossenen Filterkaffee zu",
    },
    lat: 55.6885,
    lng: 12.5594,
    rating: 4.9,
    reviews: 74,
    tags: ["coffee", "slow travel"],
  },
  {
    id: "arashiyama",
    name: { en: "Arashiyama Bamboo Grove", de: "Arashiyama-Bambushain" },
    city: "Kyoto",
    country: { en: "Japan", de: "Japan" },
    category: "outdoors",
    description: {
      en: "Tall bamboo filters the daylight into a thousand shades of green. Follow the public path at an unhurried pace, then explore the riverside paths of western Kyoto.",
      de: "Hoher Bambus filtert das Tageslicht in tausend Grüntöne. Folge dem öffentlichen Weg in aller Ruhe und erkunde danach die Wege am Fluss im Westen Kyotos.",
    },
    tip: {
      en: "Early morning is usually quieter. Stay on the marked paths and take any rubbish with you.",
      de: "Am frühen Morgen ist es meist ruhiger. Bleibe auf den markierten Wegen und nimm deinen Müll wieder mit.",
    },
    duration: { en: "2–3 hours", de: "2–3 Stunden" },
    image: bambooImage,
    alt: {
      en: "A quiet path through tall green bamboo in Kyoto",
      de: "Ein stiller Weg durch hohen grünen Bambus in Kyoto",
    },
    lat: 35.017,
    lng: 135.6713,
    rating: 4.8,
    reviews: 117,
    tags: ["nature", "walking"],
  },
  {
    id: "higashiyama",
    name: { en: "Higashiyama at dusk", de: "Higashiyama in der Dämmerung" },
    city: "Kyoto",
    country: { en: "Japan", de: "Japan" },
    category: "hidden",
    description: {
      en: "Stone-paved lanes and wooden shopfronts frame the silhouette of Yasaka Pagoda. Walk slowly, browse small craft shops, and let the neighbourhood reveal itself.",
      de: "Steingepflasterte Gassen und Holzfassaden rahmen die Silhouette der Yasaka-Pagode. Schlendere langsam, stöbere in kleinen Handwerksläden und entdecke das Viertel Schritt für Schritt.",
    },
    tip: {
      en: "Respect photography restrictions and residents. Some lanes are private; follow local signs and never photograph people without permission.",
      de: "Respektiere Fotografierverbote und Anwohner. Manche Gassen sind privat; beachte die Beschilderung und fotografiere Menschen nur mit Erlaubnis.",
    },
    duration: { en: "2 hours", de: "2 Stunden" },
    image: kyotoImage,
    alt: {
      en: "Historic Higashiyama street at sunset with Yasaka Pagoda",
      de: "Historische Straße in Higashiyama bei Sonnenuntergang mit Yasaka-Pagode",
    },
    lat: 34.9986,
    lng: 135.7781,
    rating: 4.9,
    reviews: 109,
    tags: ["heritage", "photography"],
  },
  {
    id: "florence-duomo",
    name: {
      en: "The Duomo & its little streets",
      de: "Der Dom und seine kleinen Gassen",
    },
    city: "Florence",
    country: { en: "Italy", de: "Italien" },
    category: "culture",
    description: {
      en: "Marble patterns, terracotta rooftops and a dome that changes the skyline. Start in the piazza, then lose yourself in the narrow streets around Santa Maria del Fiore.",
      de: "Marmormuster, Terrakottadächer und eine Kuppel, die das Stadtbild prägt. Beginne auf der Piazza und verliere dich anschließend in den schmalen Gassen rund um Santa Maria del Fiore.",
    },
    tip: {
      en: "The piazza is freely accessible. Check official access rules and book ahead for the dome or bell tower; modest dress is required inside the cathedral.",
      de: "Die Piazza ist frei zugänglich. Prüfe die offiziellen Zugangsregeln und buche Kuppel oder Glockenturm im Voraus; im Dom ist angemessene Kleidung erforderlich.",
    },
    duration: { en: "2–3 hours", de: "2–3 Stunden" },
    image: florenceImage,
    alt: {
      en: "Terracotta rooftops and Florence Cathedral’s dome",
      de: "Terrakottadächer und die Kuppel des Florentiner Doms",
    },
    lat: 43.7731,
    lng: 11.256,
    rating: 4.9,
    reviews: 164,
    tags: ["art", "architecture"],
  },
  {
    id: "florentine-table",
    name: { en: "At the Florentine table", de: "An der Florentiner Tafel" },
    city: "Florence",
    country: { en: "Italy", de: "Italien" },
    category: "food",
    description: {
      en: "Make room for a long lunch in the Sant’Ambrogio neighbourhood. Browse the market, find a welcoming trattoria and discover the simple pleasure of fresh pasta.",
      de: "Nimm dir Zeit für ein langes Mittagessen im Viertel Sant’Ambrogio. Schlendere über den Markt, suche eine einladende Trattoria und genieße die einfache Freude an frischer Pasta.",
    },
    tip: {
      en: "Check market opening days before visiting and ask about seasonal dishes. The food photo is illustrative, rather than a specific restaurant.",
      de: "Prüfe vor deinem Besuch die Markttage und frage nach saisonalen Gerichten. Das Food-Foto illustriert das Erlebnis und zeigt kein bestimmtes Restaurant.",
    },
    duration: { en: "2 hours", de: "2 Stunden" },
    image: pastaImage,
    alt: {
      en: "Fresh tagliatelle with a rich tomato and mushroom sauce",
      de: "Frische Tagliatelle mit aromatischer Tomaten-Pilz-Sauce",
    },
    lat: 43.7714,
    lng: 11.2663,
    rating: 4.7,
    reviews: 82,
    tags: ["food", "markets"],
  },
];

export const experiences = [
  {
    id: "lisbon-slow-morning",
    title: {
      en: "Get a little lost in Lisbon",
      de: "Verliere dich ein wenig in Lissabon",
    },
    city: "Lisbon",
    description: {
      en: "Tram-lined lanes, tiled façades and a coffee worth lingering over. A self-guided morning made for small discoveries.",
      de: "Straßenbahngassen, Kachelfassaden und ein Kaffee zum Verweilen. Ein selbst geführter Morgen voller kleiner Entdeckungen.",
    },
    duration: {
      en: "Half-day · Self-guided",
      de: "Halber Tag · Auf eigene Faust",
    },
    image: lisbonImage,
    alt: {
      en: "A yellow tram rolling through Lisbon",
      de: "Eine gelbe Straßenbahn fährt durch Lissabon",
    },
    placeId: "tram-walk",
  },
  {
    id: "kyoto-green",
    title: { en: "Find your quiet in Kyoto", de: "Finde deine Ruhe in Kyoto" },
    city: "Kyoto",
    description: {
      en: "An early walk beneath the bamboo, followed by time along the river. Leave your schedule behind for a while.",
      de: "Ein früher Spaziergang unter Bambus, danach Zeit am Fluss. Lass deinen Zeitplan für eine Weile hinter dir.",
    },
    duration: { en: "3 hours · Outdoors", de: "3 Stunden · Draußen" },
    image: bambooImage,
    alt: {
      en: "Sunlight falling through the bamboo grove in Kyoto",
      de: "Sonnenlicht fällt durch den Bambushain in Kyoto",
    },
    placeId: "arashiyama",
  },
  {
    id: "florence-food",
    title: {
      en: "A taste of the good life",
      de: "Ein Vorgeschmack aufs gute Leben",
    },
    city: "Florence",
    description: {
      en: "A market stroll and a long Florentine lunch. A little less rushing, a little more passing the pasta.",
      de: "Ein Marktspaziergang und ein langes Mittagessen in Florenz. Ein bisschen weniger Eile, ein bisschen mehr Pasta.",
    },
    duration: {
      en: "2 hours · Food & culture",
      de: "2 Stunden · Essen & Kultur",
    },
    image: pastaImage,
    alt: {
      en: "A generous pan of fresh Italian pasta",
      de: "Eine große Pfanne mit frischer italienischer Pasta",
    },
    placeId: "florentine-table",
  },
];

export const gallery = [
  {
    image: heroImage,
    alt: {
      en: "Pastel houses above the rocky harbour of Manarola",
      de: "Pastellfarbene Häuser über dem felsigen Hafen von Manarola",
    },
    location: "Manarola, Italy",
  },
  {
    image: kyotoImage,
    alt: {
      en: "Kyoto’s Yasaka Pagoda at sunset",
      de: "Kyotos Yasaka-Pagode bei Sonnenuntergang",
    },
    location: "Kyoto, Japan",
  },
  {
    image: copenhagenImage,
    alt: {
      en: "Boats and colourful houses on Nyhavn canal",
      de: "Boote und bunte Häuser am Nyhavn-Kanal",
    },
    location: "Copenhagen, Denmark",
  },
  {
    image: coastImage,
    alt: {
      en: "White and peach stairway overlooking the blue Aegean Sea",
      de: "Weiße und pfirsichfarbene Treppen mit Blick auf die blaue Ägäis",
    },
    location: "Santorini, Greece",
  },
  {
    image: florenceImage,
    alt: {
      en: "Florentine rooftops surrounding the cathedral dome",
      de: "Florentiner Dächer rund um die Domkuppel",
    },
    location: "Florence, Italy",
  },
  {
    image: lisbonImage,
    alt: {
      en: "A yellow Lisbon tram on an old cobblestone street",
      de: "Eine gelbe Lissabonner Straßenbahn auf altem Kopfsteinpflaster",
    },
    location: "Lisbon, Portugal",
  },
];
