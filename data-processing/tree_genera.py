#!/usr/bin/env python3
"""
Konfiguration und Normalisierung der Obstbaum-Gattungen.

Dieses Modul ist die **zentrale Konfigurationsstelle** dafür, welche
Baum-Gattungen als Obstbäume gelten. Es wird sowohl vom Analyse-Skript
(``analyze_tree_genera.py``) als auch von der Verarbeitungspipeline
(``process_streuobstwiesen.py``) genutzt.

OSM-Daten sind erfahrungsgemäß "schmutzig": gemischte wissenschaftliche und
deutsche Namen, Tippfehler, Klein-/Großschreibung. ``canonical_genus`` bildet
einen Rohwert aus ``genus`` bzw. ``genus:de`` auf eine kanonische
(wissenschaftliche) Gattung ab und normalisiert dabei Schreibfehler.

Konfiguration: ``FRUIT_GENERA`` erweitern/anpassen. Schlüssel = kanonische
Gattung (wird so ausgegeben), Werte = Alias-Tokens (werden über ``_norm``
normalisiert verglichen).
"""

import re
import unicodedata


# ---------------------------------------------------------------------------
# Konfiguration: kanonische Gattung -> Alias-Tokens (werden normalisiert
# verglichen, s. _norm). Aufgenommen werden wissenschaftliche Gattung, deutsche
# Trivialnamen und in den Daten tatsächlich vorkommende Tippfehler/Varianten.
# ---------------------------------------------------------------------------
FRUIT_GENERA = {
    "Malus": ["malus", "malu", "apfel", "apfelbaum", "apfelbaeume", "apple"],
    "Pyrus": ["pyrus", "birne", "birnbaum", "birnen", "pear"],
    # Prunus = Steinobst: Kirsche, Pflaume, Zwetschge, Mirabelle, Pfirsich,
    # Aprikose, Schlehe. Cerasus ist ein Untergattungs-/Synonym-Name für Kirsche.
    "Prunus": [
        "prunus", "cerasus", "steinobst", "kirsche", "kirschbaum", "suesskirsche",
        "sauerkirsche", "pflaume", "pflaumenbaum", "zwetschge", "zwetschke",
        "mirabelle", "pfirsich", "aprikose", "marille", "schlehe", "cherry",
        "plum",
    ],
    "Cydonia": ["cydonia", "quitte", "quince"],
    "Mespilus": ["mespilus", "mispel", "medlar"],
    "Juglans": ["juglans", "walnuss", "walnussbaum", "walnut", "nussbaum"],
    # Castanea = Edel-/Esskastanie (NICHT Aesculus = Rosskastanie!). Das bloße
    # "Kastanie" meint im Deutschen meist die Rosskastanie und wird bewusst
    # NICHT als Obst gewertet.
    "Castanea": [
        "castanea", "edelkastanie", "esskastanie", "edel-kastanie",
        "ess-kastanie", "marone", "maroni", "chestnut", "sweet chestnut",
    ],
    "Corylus": ["corylus", "hasel", "haselnuss", "haselnussbaum", "hazel", "baumhasel"],
    # Sorbus s.l. inkl. der heute oft abgespaltenen Segregat-Gattungen.
    # Streuobst-relevant v.a. Speierling (Sorbus/Cormus domestica), Elsbeere
    # (Torminalis), Vogelbeere/Eberesche (S. aucuparia), Mehlbeere (Aria).
    "Sorbus": [
        "sorbus", "cormus", "aria", "torminalis", "karpatiosorbus",
        "scandosorbus", "hedlundia", "majovskya", "eberesche", "vogelbeere",
        "speierling", "elsbeere", "mehlbeere", "oxelbeere", "rowan",
    ],
    "Morus": ["morus", "maulbeere", "maulbeerbaum", "mulberry"],
    "Ficus": ["ficus", "feige", "feigenbaum", "fig"],
}


# Deutscher Anzeigename je kanonischer Gattung (für Statistik/UI).
GERMAN_NAME = {
    "Malus": "Apfel",
    "Pyrus": "Birne",
    "Prunus": "Steinobst",
    "Cydonia": "Quitte",
    "Mespilus": "Mispel",
    "Juglans": "Walnuss",
    "Castanea": "Edelkastanie",
    "Corylus": "Hasel",
    "Sorbus": "Eberesche & Mehlbeere",
    "Morus": "Maulbeere",
    "Ficus": "Feige",
}


def _norm(value: str) -> str:
    """Normalisiere einen Rohwert: trim, lower, Umlaute -> ASCII, Mehrfach-Spaces."""
    v = value.strip().lower()
    v = v.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    v = unicodedata.normalize("NFKD", v).encode("ascii", "ignore").decode("ascii")
    v = re.sub(r"\s+", " ", v)
    return v


def build_lookup(*group_dicts) -> dict:
    """Token -> kanonische Gattung. Ohne Argumente wird ``FRUIT_GENERA`` genutzt."""
    if not group_dicts:
        group_dicts = (FRUIT_GENERA,)
    lookup = {}
    for group in group_dicts:
        for canon, aliases in group.items():
            for alias in [canon] + aliases:
                lookup[_norm(alias)] = canon
    return lookup


# Vorberechnetes Lookup für FRUIT_GENERA (häufiger Pfad in der Pipeline).
_FRUIT_LOOKUP = build_lookup(FRUIT_GENERA)


def classify(raw_value: str, lookup: dict | None = None) -> str | None:
    """Ordne einen einzelnen Rohwert einer kanonischen Gattung zu (oder None).

    Greift auch beim ersten Wort eines mehrteiligen wissenschaftlichen Namens
    (z.B. ``"malus domestica"`` -> ``"Malus"``).
    """
    if lookup is None:
        lookup = _FRUIT_LOOKUP
    if not raw_value:
        return None
    n = _norm(raw_value)
    if n in lookup:
        return lookup[n]
    first = n.split(" ", 1)[0]
    return lookup.get(first)


def canonical_genus(tags, lookup: dict | None = None) -> str | None:
    """Ermittle die kanonische Obst-Gattung aus den Tags eines Baums.

    Berücksichtigt ``genus`` und ``genus:de``. ``tags`` kann ein dict oder ein
    pyosmium-TagList sein (beides unterstützt ``in`` und ``[]``/``get``).
    Gibt die kanonische Gattung zurück oder ``None``, wenn kein Obstbaum.
    """
    if lookup is None:
        lookup = _FRUIT_LOOKUP
    for key in ("genus", "genus:de"):
        if key in tags:
            canon = classify(tags[key], lookup)
            if canon:
                return canon
    return None
