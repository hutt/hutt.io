---
title: API Tagesordnung des Bundestags
zeitraum: "2024"
kategorien:
  - Web-Entwicklung
tags_extra:
  - API
  - Cloudflare Worker
bild: screenshot-bt-to.png
referenzen:
  - titel: 'POLITICO Europe: „Berlin Playbook" vom 3. Juni 2024'
    url: "https://www.politico.eu/newsletter/berlin-playbook/der-polizistenmord-und-die-politischen-folgen/"
  - titel: 'Süddeutsche Zeitung Dossier: „Platz der Republik" vom 7. Juni 2024'
    url: "https://www.sz-dossier.de/newsletters/platz-der-republik/2024-06-07-bleibt-die-amtsstube-bald-leer"
---

Der Deutsche Bundestag stellt seine Tagesordnung online zur Verfügung – nur leider in keinem maschinenlesbaren Format. Das führt dazu, dass in Sitzungswochen mindestens 734 Abgeordnetenbüros händisch die Tagesordnungspunkte in ihren Kalendern aktualisieren müssen. Deshalb habe ich eine inoffizielle API entwickelt, mit der man sich die aktuelle Tagesordnung direkt als iCal-Feed holen und so in den eigenen Kalender einbetten kann. Immer aktuell, mit allen Infos, die man auch auf der Website findet. Mehr Informationen gibt es unter [api.hutt.io/bt-to/](https://api.hutt.io/bt-to/) oder direkt [bei GitHub](https://github.com/hutt/bt-to).