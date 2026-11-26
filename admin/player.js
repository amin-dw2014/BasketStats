/* =========================================
    VARIABLES ET ÉLÉMENTS HTML
========================================= */

// ÉLÉMENTS DU PROFIL

const profileName = document.getElementById('profileName');
const profileImage = document.getElementById('profileImage');
const playerNotFound = document.getElementById('playerNotFound');
const profileHeader = document.querySelector('.player-profile-header');
const playerMatches = document.querySelector('.player-matches');
const matchesList = document.getElementById('matchesList');
const noMatch = document.getElementById('noMatch');

// ÉLÉMENTS DE LA MODAL DE SUPPRESSION

const deleteMatchModal = document.getElementById('deleteMatchModal');
const cancelDeleteMatch = document.getElementById('cancelDeleteMatch');
const confirmDeleteMatch = document.getElementById('confirmDeleteMatch');

// ÉLÉMENTS DES STATISTIQUES

const playerStats = document.getElementById('playerStats');
const totalMatchesElement = document.getElementById('totalMatches');
const totalPointsElement = document.getElementById('totalPoints');
const averagePointsElement = document.getElementById('averagePoints');
const averagePerMinuteElement = document.getElementById('averagePerMinute');
const totalMinutesElement = document.getElementById('totalMinutes');


/* =========================================
    IDENTIFIANTS DES ACTIONS EN COURS
========================================= */

let selectedMatchId = null;


/* =========================================
    RÉCUPÉRER LE JOUEUR
========================================= */

// Récupérer l'identifiant dans l'adresse de la page

const params = new URLSearchParams(window.location.search);
const playerId = params.get('id');

// Récupérer les joueurs du localStorage

let players = JSON.parse(localStorage.getItem('basketPlayers')) || [];

// Chercher le joueur qui possède cet identifiant

const player = players.find((item) => String(item.id) === playerId);


/* =========================================
    PRÉPARER LES MATCHS DU JOUEUR
========================================= */

if (player) {
    if (!Array.isArray(player.matches)) {
        player.matches = [];
    }
}

// =========================================
// ÉLÉMENTS DES NOUVELLES STATISTIQUES
// =========================================

const totalThreePointsElement =
    document.getElementById('totalThreePoints');

const averageFreeThrowsElement =
    document.getElementById('averageFreeThrows');

const averageFoulsElement =
    document.getElementById('averageFouls');


/* =========================================
    AFFICHER LES INFORMATIONS DU JOUEUR
========================================= */

if (player) {

    // Afficher le nom
    profileName.textContent = player.name;

    // Afficher la photo
    profileImage.src = player.image || 'images/no-players.png';
    profileImage.alt = `Photo de ${player.name}`;

} else {

    // Afficher un message si le joueur n'existe pas
    profileHeader.hidden = true;
    playerMatches.hidden = true;
    playerNotFound.hidden = false;
}


/* =========================================
    AFFICHER LES MATCHS
========================================= */

if (player) {
    displayMatches();
}


/* =========================================
    ENREGISTRER LES MATCHS
========================================= */

async function saveMatches() {
    await BasketStatsCloud.save(players);
}


/* =========================================
    ANNULER LA SUPPRESSION D'UN MATCH
========================================= */

cancelDeleteMatch.addEventListener('click', () => {
    deleteMatchModal.hidden = true;
    selectedMatchId = null;
});


/* =========================================
    CONFIRMER LA SUPPRESSION D'UN MATCH
========================================= */

confirmDeleteMatch.addEventListener('click', async () => {

    if (selectedMatchId === null || !player) return;

    // Retirer uniquement le match sélectionné
    player.matches = player.matches.filter((match) => {
        return String(match.id) !== String(selectedMatchId);
    });

    // Enregistrer les changements dans la base commune
    try {
        await saveMatches();
    } catch (error) {
        console.error(error);
        alert('La suppression du match n’a pas pu être enregistrée : ' + error.message);
        return;
    }

    // Fermer la fenêtre
    deleteMatchModal.hidden = true;

    // Oublier l'identifiant sélectionné
    selectedMatchId = null;

    // Actualiser les matchs affichés
    displayMatches();
});


/* =========================================
    FERMER EN CLIQUANT SUR LE FOND SOMBRE
========================================= */

deleteMatchModal.addEventListener('click', (event) => {

    if (event.target === deleteMatchModal) {
        deleteMatchModal.hidden = true;
        selectedMatchId = null;
    }

});

/* =========================================
    AFFICHER LES MATCHS DU JOUEUR
========================================= */

function displayMatches() {

    // Actualiser les statistiques
    updatePlayerStats();

    // Vider la liste des matchs
    matchesList.innerHTML = '';

    // Vérifier si le joueur possède des matchs
    if (player.matches.length === 0) {
        noMatch.style.display = 'flex';
        return;
    }

    noMatch.style.display = 'none';

    // Parcourir tous les matchs du joueur
    player.matches.forEach((match) => {

        // CRÉER LA CARTE DU MATCH

        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card');

        const points = Number(match.points);
        const minutes = Number(match.minutes);

        // Calculer la moyenne de points par minute
        const average = minutes > 0
            ? (points / minutes).toFixed(2).replace('.', ',')
            : '—';

        // Créer le contenu de la carte
        matchCard.innerHTML = `
            <div class="match-info">
                <h3>Equipe adverse</h3>
                <p>${match.opponent}</p>
            </div>

            <div class="match-stat">
                <span>Points</span>
                <strong>${match.points}</strong>
            </div>

            <div class="match-stat">
                <span>Minutes</span>
                <strong>${match.minutes} min</strong>
            </div>

            <div class="match-stat match-average">
                <span>Moyenne / min</span>
                <strong>${average}</strong>
            </div>

            <div class="match-date">
                <span>Date</span>
                <strong>
                    ${new Date(match.date + 'T00:00:00').toLocaleDateString('fr-FR')}
                </strong>
            </div>

            <div class="match-actions">
                <button type="button" class="delete-match-btn" aria-label="Supprimer ce match">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;


        /* =================================
            BOUTON SUPPRIMER
        ================================= */

        const deleteButton = matchCard.querySelector('.delete-match-btn');

        deleteButton.addEventListener('click', () => {

            // Retenir l'identifiant du match à supprimer
            selectedMatchId = match.id;

            // Ouvrir la confirmation
            deleteMatchModal.hidden = false;

        });


        // Ajouter la carte à la liste
        matchesList.appendChild(matchCard);

    });

}


/* =========================================
    CALCULER LES STATISTIQUES GÉNÉRALES
========================================= */

function updatePlayerStats() {

    // NOMBRE TOTAL DE MATCHS

    const matchesCount = player.matches.length;


    // ADDITIONNER TOUS LES POINTS

    const pointsTotal = player.matches.reduce((total, match) => {
        return total + Number(match.points || 0);
    }, 0);


    // ADDITIONNER TOUTES LES MINUTES

    const minutesTotal = player.matches.reduce((total, match) => {
        return total + Number(match.minutes || 0);
    }, 0);


    // CALCULER LA MOYENNE DE POINTS PAR MATCH

    const pointsAverage = matchesCount > 0
        ? (pointsTotal / matchesCount).toFixed(2)
        : '0';


    // CALCULER LA MOYENNE DE POINTS PAR MINUTE

    const minuteAverage = minutesTotal > 0
        ? (pointsTotal / minutesTotal).toFixed(2)
        : '0';

    // =========================================
    // TOTAL DES 3 POINTS
    // =========================================

    const threePointsTotal = player.matches.reduce((total, match) => {
        return total + Number(match.threePoints || 0);
    }, 0);


    // =========================================
    // TOTAL DES LANCERS FRANCS
    // =========================================

    const freeThrowsTotal = player.matches.reduce((total, match) => {
        return total + Number(match.freeThrows || 0);
    }, 0);


    // =========================================
    // TOTAL DES FAUTES
    // =========================================

    const foulsTotal = player.matches.reduce((total, match) => {
        return total + Number(match.fouls || 0);
    }, 0);


    // =========================================
    // MOYENNES PAR MATCH
    // =========================================

    const threePointsAverage = matchesCount > 0
        ? (threePointsTotal / matchesCount).toFixed(2)
        : '0';

    const freeThrowsAverage = matchesCount > 0
        ? (freeThrowsTotal / matchesCount).toFixed(2)
        : '0';

    const foulsAverage = matchesCount > 0
        ? (foulsTotal / matchesCount).toFixed(2)
        : '0';


    // AFFICHER LES RÉSULTATS DANS LE HTML

    totalMatchesElement.textContent = matchesCount;
    totalPointsElement.textContent = pointsTotal;
    averagePointsElement.textContent = pointsAverage.replace('.', ',');
    averagePerMinuteElement.textContent = minuteAverage.replace('.', ',');
    totalThreePointsElement.textContent = threePointsTotal;
    averageFreeThrowsElement.textContent = freeThrowsAverage.replace('.', ',');
    averageFoulsElement.textContent = foulsAverage.replace('.', ',');


    // CALCULER LA MOYENNE DE TEMPS DE JEU

    const averageMinutes = matchesCount > 0
        ? minutesTotal / matchesCount
        : 0;

    totalMinutesElement.textContent =
        (Number.isInteger(averageMinutes)
            ? averageMinutes
            : averageMinutes.toFixed(1).replace('.', ','))
        + ' min';


    // MASQUER LES STATISTIQUES LORSQU'IL N'Y A AUCUN MATCH

    playerStats.hidden = matchesCount === 0;

}