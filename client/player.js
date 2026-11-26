/* =========================================
   BASKETSTATS CLIENT — FICHE JOUEUR
   Consultation uniquement : aucune suppression
   ni aucun formulaire de modification.
========================================= */

const profileName = document.getElementById('profileName');
const profileImage = document.getElementById('profileImage');
const playerNotFound = document.getElementById('playerNotFound');
const profileHeader = document.querySelector('.player-profile-header');
const playerMatches = document.querySelector('.player-matches');
const matchesList = document.getElementById('matchesList');
const noMatch = document.getElementById('noMatch');

const playerStats = document.getElementById('playerStats');
const totalMatchesElement = document.getElementById('totalMatches');
const totalPointsElement = document.getElementById('totalPoints');
const averagePointsElement = document.getElementById('averagePoints');
const averagePerMinuteElement = document.getElementById('averagePerMinute');
const totalMinutesElement = document.getElementById('totalMinutes');
const totalThreePointsElement = document.getElementById('totalThreePoints');
const averageFreeThrowsElement = document.getElementById('averageFreeThrows');
const averageFoulsElement = document.getElementById('averageFouls');

const params = new URLSearchParams(window.location.search);
const playerId = params.get('id');

let players = [];
try {
    const stored = JSON.parse(localStorage.getItem('basketPlayers') || '[]');
    players = Array.isArray(stored) ? stored : [];
} catch (error) {
    console.error('Impossible de lire les données BasketStats :', error);
}

const player = players.find((item) => String(item.id) === String(playerId));

if (player) {
    if (!Array.isArray(player.matches)) player.matches = [];

    if (profileName) profileName.textContent = player.name || 'Joueur';
    if (profileImage) {
        profileImage.src = player.image || 'images/no-players.png';
        profileImage.alt = `Photo de ${player.name || 'joueur'}`;
    }
    displayMatches();
} else {
    if (profileHeader) profileHeader.hidden = true;
    if (playerMatches) playerMatches.hidden = true;
    if (playerNotFound) playerNotFound.hidden = false;
}

/* AFFICHER LES MATCHS EN LECTURE SEULE */
function displayMatches() {
    if (!player || !matchesList) return;

    updatePlayerStats();
    matchesList.innerHTML = '';

    if (!player.matches.length) {
        if (noMatch) noMatch.style.display = 'flex';
        return;
    }

    if (noMatch) noMatch.style.display = 'none';

    player.matches.forEach((match) => {
        const card = document.createElement('div');
        card.classList.add('match-card');

        const points = Number(match.points || 0);
        const minutes = Number(match.minutes || 0);
        const average = minutes > 0
            ? (points / minutes).toFixed(2).replace('.', ',')
            : '—';

        const info = document.createElement('div');
        info.classList.add('match-info');
        const opponentTitle = document.createElement('h3');
        opponentTitle.textContent = 'Équipe adverse';
        const opponent = document.createElement('p');
        opponent.textContent = match.opponent || 'Non renseignée';
        info.append(opponentTitle, opponent);

        function stat(label, value, className = 'match-stat') {
            const element = document.createElement('div');
            element.className = className;
            const title = document.createElement('span');
            title.textContent = label;
            const strong = document.createElement('strong');
            strong.textContent = value;
            element.append(title, strong);
            return element;
        }

        const date = document.createElement('div');
        date.classList.add('match-date');
        const dateTitle = document.createElement('span');
        dateTitle.textContent = 'Date';
        const dateValue = document.createElement('strong');
        const parsedDate = match.date
            ? new Date(`${match.date}T00:00:00`)
            : null;
        dateValue.textContent = parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleDateString('fr-FR')
            : '—';
        date.append(dateTitle, dateValue);

        // Aucun bouton d'action dans la version Client.
        card.append(
            info,
            stat('Points', String(match.points ?? 0)),
            stat('Minutes', `${match.minutes ?? 0} min`),
            stat('Moyenne / min', average, 'match-stat match-average'),
            date
        );

        matchesList.appendChild(card);
    });
}

/* CALCULER LES STATISTIQUES DU JOUEUR */
function updatePlayerStats() {
    if (!player) return;

    const matches = player.matches;
    const matchesCount = matches.length;

    const pointsTotal = matches.reduce((sum, match) => sum + Number(match.points || 0), 0);
    const minutesTotal = matches.reduce((sum, match) => sum + Number(match.minutes || 0), 0);
    const threePointsTotal = matches.reduce((sum, match) => sum + Number(match.threePoints || 0), 0);
    const freeThrowsTotal = matches.reduce((sum, match) => sum + Number(match.freeThrows || 0), 0);
    const foulsTotal = matches.reduce((sum, match) => sum + Number(match.fouls || 0), 0);

    const pointsAverage = matchesCount ? (pointsTotal / matchesCount).toFixed(2) : '0';
    const minuteAverage = minutesTotal ? (pointsTotal / minutesTotal).toFixed(2) : '0';
    const threePointsAverage = matchesCount ? (threePointsTotal / matchesCount).toFixed(2) : '0';
    const freeThrowsAverage = matchesCount ? (freeThrowsTotal / matchesCount).toFixed(2) : '0';
    const foulsAverage = matchesCount ? (foulsTotal / matchesCount).toFixed(2) : '0';
    const averageMinutes = matchesCount ? minutesTotal / matchesCount : 0;

    if (totalMatchesElement) totalMatchesElement.textContent = matchesCount;
    if (totalPointsElement) totalPointsElement.textContent = pointsTotal;
    if (averagePointsElement) averagePointsElement.textContent = pointsAverage.replace('.', ',');
    if (averagePerMinuteElement) averagePerMinuteElement.textContent = minuteAverage.replace('.', ',');
    if (totalThreePointsElement) totalThreePointsElement.textContent = threePointsTotal;
    if (averageFreeThrowsElement) averageFreeThrowsElement.textContent = freeThrowsAverage.replace('.', ',');
    if (averageFoulsElement) averageFoulsElement.textContent = foulsAverage.replace('.', ',');
    if (totalMinutesElement) {
        totalMinutesElement.textContent =
            (Number.isInteger(averageMinutes)
                ? averageMinutes
                : averageMinutes.toFixed(1).replace('.', ',')) + ' min';
    }
    if (playerStats) playerStats.hidden = matchesCount === 0;
}
