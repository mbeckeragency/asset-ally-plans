

## Finanz-Manager App

Eine moderne, minimalistische Personal-Finance-App mit Account-System, Fixkosten-Tracking, Spar-Rechner und Dashboard.

### 1. Authentifizierung & Account
- Registrierung und Login (E-Mail/Passwort)
- Passwort-zurücksetzen-Funktion
- Benutzerprofil mit Name und Währungseinstellung
- Alle Finanzdaten sind an den Account gebunden und werden in der Cloud gespeichert

### 2. Dashboard (Startseite)
- Übersicht über monatliche Einnahmen und Ausgaben auf einen Blick
- Aktuelle Sparquote als Prozent-Anzeige
- Visualisierung der Ausgaben nach Kategorien (Kreisdiagramm)
- Monatlicher Trend der Einnahmen vs. Ausgaben (Liniendiagramm)
- Schnellzugriff auf die wichtigsten Aktionen

### 3. Fixkosten-Tracker
- Einnahmen erfassen (Gehalt, Nebeneinkünfte etc.)
- Fixkosten anlegen mit Kategorie, Betrag und Intervall (monatlich/jährlich)
- Kategorien wie Miete, Versicherungen, Abos, Strom, Internet etc.
- Übersicht aller laufenden Kosten mit Bearbeitungs- und Löschfunktion
- Monatliche Gesamtübersicht der fixen Belastungen

### 4. Spar-Rechner
- **ETF-Sparplan-Rechner**: Monatliche Sparrate, Laufzeit und erwartete Rendite eingeben → Endvermögen mit Zinseszins berechnen
- **Sparpotenzial**: Basierend auf Einnahmen und Fixkosten wird das freie Budget angezeigt
- Visuelle Darstellung des Vermögenswachstums über Zeit (Balken-/Liniendiagramm)

### 5. Design & Navigation
- Modernes, minimalistisches Design mit viel Weißraum
- Seitennavigation mit Icons (Dashboard, Fixkosten, Spar-Rechner)
- Responsive für Desktop und Mobile
- Saubere Typografie und dezente Farbakzente

### Backend (Supabase/Lovable Cloud)
- Datenbank für Benutzerprofile, Einnahmen und Fixkosten
- Row-Level Security damit jeder nur seine eigenen Daten sieht
- Authentifizierung über Supabase Auth

