/* =========================================
    VARIABLES GLOBALES
========================================= */

const rankingList = document.getElementById('rankingList');
const rankingEmpty = document.getElementById('rankingEmpty');
const threePointsRankingList = document.getElementById('threePointsRankingList');


/* =========================================
    NAVIGATION ENTRE LES PAGES
========================================= */

const links = document.querySelectorAll('[data-page]');
const pages = document.querySelectorAll('.page');

let changingPage = false;

links.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();

        const targetId = link.dataset.page;
        const currentPage = document.querySelector('.page.active');
        const targetPage = document.getElementById(targetId);

        // Vérifications
        if (!targetPage || targetPage === currentPage || changingPage) {
            return;
        }

        changingPage = true;

        // Faire disparaître l'ancienne page
        currentPage.classList.add('fade-out');
        currentPage.classList.remove('active');

        setTimeout(() => {
            // Cacher l'ancienne page
            currentPage.classList.remove('fade-out');

            // Afficher la nouvelle page
            targetPage.classList.add('active');

            changingPage = false;
        }, 300);

        // Mettre à jour l'adresse dans le navigateur
        history.replaceState(null, '', link.getAttribute('href'));

        // Fermer le menu burger après navigation
        menu.classList.remove('active');
        burger.innerHTML = '<i class="fa-solid fa-bars"></i>';
        burger.setAttribute('aria-label', 'Ouvrir le menu');
    });
});


/* =========================================
    MENU BURGER
========================================= */

const burger = document.querySelector('.responsive-nav');
const menu = document.querySelector('.responsive-menu');

burger.addEventListener('click', () => {
    menu.classList.toggle('active');

    const menuOuvert = menu.classList.contains('active');

    burger.innerHTML = menuOuvert
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';

    burger.setAttribute(
        'aria-label',
        menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'
    );
});


/* =========================================
    AJOUTER UN JOUEUR
========================================= */

// RÉCUPÉRER LES ÉLÉMENTS HTML

const addPlayerBtn = document.getElementById('addPlayerBtn');
const playerModal = document.getElementById('playerModal');
const closePlayerModal = document.getElementById('closePlayerModal');
const cancelPlayer = document.getElementById('cancelPlayer');
const playerForm = document.getElementById('playerForm');
const playersList = document.getElementById('playersList');
const emptyPlayers = document.querySelector('.no-players');
const searchPlayer = document.getElementById('searchPlayer');


// ÉLÉMENTS DE LA SUPPRESSION

const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

let selectedPlayerId = null;


// ÉLÉMENTS DE LA PHOTO

const playerImage = document.getElementById('playerImage');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');


// RÉCUPÉRER LES JOUEURS ENREGISTRÉS

let players = JSON.parse(localStorage.getItem('basketPlayers')) || [];

// Ajouter un identifiant aux anciens joueurs
players.forEach((player) => {
    if (!player.id) {
        player.id = `${Date.now()}-${Math.random()}`;
    }
});

// Les données initiales ont été chargées depuis Supabase par cloud.js.
// Les nouveaux identifiants seront inclus lors de la prochaine sauvegarde.


/* =========================================
    OUVRIR ET FERMER LA MODAL
========================================= */

// Ouvrir la fenêtre
addPlayerBtn.addEventListener('click', () => {
    playerModal.hidden = false;
});

// Fermer avec la croix
closePlayerModal.addEventListener('click', () => {
    playerModal.hidden = true;
});

// Fermer avec Annuler
cancelPlayer.addEventListener('click', () => {
    playerModal.hidden = true;
});


// ANNULER LA SUPPRESSION

cancelDelete.addEventListener('click', () => {
    deleteModal.hidden = true;
    selectedPlayerId = null;
});


// CONFIRMER LA SUPPRESSION

confirmDelete.addEventListener('click', async () => {
    if (selectedPlayerId === null) return;

    // Retirer le joueur du tableau
    players = players.filter((player) => {
        return player.id !== selectedPlayerId;
    });

    // Enregistrer le nouveau tableau
    try {
        await BasketStatsCloud.save(players);
    } catch (error) {
        console.error(error);
        alert('La suppression n’a pas pu être enregistrée en ligne : ' + error.message);
        return;
    }

    // Actualiser les cartes
    displayPlayers();
    displayRanking();

    // Fermer la fenêtre
    deleteModal.hidden = true;

    // Réinitialiser le joueur sélectionné
    selectedPlayerId = null;
});


// FERMER EN CLIQUANT SUR LE FOND SOMBRE

deleteModal.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
        deleteModal.hidden = true;
        selectedPlayerId = null;
    }
});


// FERMER LA MODAL EN CLIQUANT SUR LE FOND SOMBRE

playerModal.addEventListener('click', (event) => {
    if (event.target === playerModal) {
        playerModal.hidden = true;
    }
});


// FERMER LES MODALS AVEC ÉCHAP

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (!deleteModal.hidden) {
            deleteModal.hidden = true;
            selectedPlayerId = null;
        } else if (!playerModal.hidden) {
            playerModal.hidden = true;
        }
    }
});


/* =========================================
    PRÉVISUALISATION DE LA PHOTO
========================================= */

playerImage.addEventListener('change', () => {
    const file = playerImage.files[0];

    if (!file) return;

    // Vérifier que le fichier est une image
    if (!file.type.startsWith('image/')) {
        alert('Merci de choisir un fichier image.');
        playerImage.value = '';
        return;
    }

    // Vérifier la taille du fichier : maximum 10 Mo
    if (file.size > 10 * 1024 * 1024) {
        alert('Cette image est trop lourde. Choisis une image de moins de 10 Mo.');
        playerImage.value = '';
        return;
    }

    // Lire le fichier
    const reader = new FileReader();

    reader.onload = () => {
        previewImg.src = reader.result;
        imagePreview.hidden = false;
    };

    reader.readAsDataURL(file);
});


/* =========================================
    COMPRESSER LA PHOTO
========================================= */

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 700;

                let width = image.width;
                let height = image.height;

                // Réduire les dimensions sans déformer la photo
                if (width > height && width > maxSize) {
                    height = height * (maxSize / width);
                    width = maxSize;
                } else if (height > maxSize) {
                    width = width * (maxSize / height);
                    height = maxSize;
                }

                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext('2d');

                if (!context) {
                    reject(new Error('Impossible de traiter cette image.'));
                    return;
                }

                context.drawImage(image, 0, 0, width, height);

                // Transformer en image JPEG compressée
                const compressedImage = canvas.toDataURL('image/jpeg', 0.75);
                resolve(compressedImage);
            };

            image.onerror = () => {
                reject(new Error('Image impossible à charger.'));
            };

            image.src = reader.result;
        };

        reader.onerror = () => {
            reject(new Error('Impossible de lire le fichier.'));
        };

        reader.readAsDataURL(file);
    });
}

/* =========================================
    AFFICHER LES JOUEURS
========================================= */

function displayPlayers() {

    // Vider l'ancien affichage
    playersList.innerHTML = '';

    // Afficher ou cacher le message vide
    emptyPlayers.hidden = players.length > 0;

    // Parcourir les joueurs
    players.forEach((player) => {

        // CRÉER LA CARTE
        const playerCard = document.createElement('div');
        playerCard.classList.add('player-card');

        // OUVRIR LA FICHE DU JOUEUR AU CLIC
        playerCard.addEventListener('click', () => {
            window.location.href = `player.html?id=${encodeURIComponent(player.id)}`;
        });

        // CRÉER LE BOUTON POUBELLE
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('player-delete-btn');
        deleteButton.setAttribute('aria-label', `Supprimer ${player.name}`);
        deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

        // OUVRIR LA CONFIRMATION DE SUPPRESSION
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            selectedPlayerId = player.id;
            deleteModal.hidden = false;
        });

        // CRÉER LA ZONE PHOTO
        const photoContainer = document.createElement('div');
        photoContainer.classList.add('player-card-photo');

        // SI LE JOUEUR A UNE PHOTO
        if (player.image) {
            const playerImageElement = document.createElement('img');
            playerImageElement.src = player.image;
            playerImageElement.alt = `Photo de ${player.name}`;
            playerImageElement.classList.add('player-card-image');
            photoContainer.appendChild(playerImageElement);
        } else {

            // SI LE JOUEUR N'A PAS DE PHOTO
            const noImage = document.createElement('div');
            noImage.classList.add('player-card-no-image');

            const basketballIcon = document.createElement('i');
            basketballIcon.classList.add('fa-solid', 'fa-basketball');

            noImage.appendChild(basketballIcon);
            photoContainer.appendChild(noImage);
        }

        // CRÉER LA ZONE DES INFORMATIONS
        const content = document.createElement('div');
        content.classList.add('player-card-content');

        // NOM DU JOUEUR
        const playerName = document.createElement('h3');
        playerName.textContent = player.name;

        // NUMÉRO DU MAILLOT
        const playerNumber = document.createElement('span');
        playerNumber.classList.add('player-number-badge');
        playerNumber.textContent = `N° ${player.number}`;

        // FONCTION POUR CRÉER UNE INFORMATION
        function createDetail(label, value) {
            const detail = document.createElement('div');
            detail.classList.add('player-detail');

            const title = document.createElement('span');
            title.textContent = label;

            const text = document.createElement('strong');
            text.textContent = value || 'Non renseigné';

            detail.append(title, text);

            return detail;
        }

        // INFORMATIONS DU JOUEUR
        const details = document.createElement('div');
        details.classList.add('player-details');

        details.append(
            createDetail('Position', player.position),
            createDetail(
                'Âge',
                player.age ? `${player.age} ans` : ''
            ),
            createDetail(
                'Taille',
                player.height ? `${player.height} cm` : ''
            )
        );

        // DESCRIPTION
        if (player.description) {
            const description = document.createElement('p');
            description.classList.add('player-card-description');
            description.textContent = player.description;
            content.appendChild(description);
        }

        // ASSEMBLER LE CONTENU
        content.append(
            playerName,
            playerNumber,
            details
        );

        // ASSEMBLER LA CARTE
        playerCard.append(
            photoContainer,
            content
        );

        photoContainer.appendChild(deleteButton);

        // AJOUTER LA CARTE À LA PAGE
        playersList.appendChild(playerCard);
    });
}


/* =========================================
    AFFICHER LE CLASSEMENT
========================================= */

function displayRanking() {

    // VIDER L'ANCIEN CLASSEMENT
    rankingList.innerHTML = '';

    // CRÉER UNE COPIE DES JOUEURS
    const rankedPlayers = [...players];

    // CALCULER LES MOYENNES DE CHAQUE JOUEUR
    rankedPlayers.forEach((player) => {

        const matches = Array.isArray(player.matches)
            ? player.matches
            : [];

        // TOTAL DES POINTS
        const totalPoints = matches.reduce((total, match) => {
            return total + Number(match.points || 0);
        }, 0);

        // TOTAL DES 3 POINTS
        const totalThreePoints = matches.reduce((total, match) => {
            return total + Number(match.threePoints || 0);
        }, 0);

        // NOMBRE DE MATCHS
        const totalMatches = matches.length;

        // MOYENNE DE POINTS PAR MATCH
        player.rankingAverage = totalMatches > 0
            ? totalPoints / totalMatches
            : null;

        // MOYENNE DE 3PTS PAR MATCH
        player.rankingThreePointsAverage = totalMatches > 0
            ? totalThreePoints / totalMatches
            : null;

        // TOTAL DES POINTS POUR DÉPARTAGER
        player.rankingTotalPoints = totalPoints;

        // SCORE COMBINÉ
        player.rankingScore = totalMatches > 0
            ? player.rankingAverage + player.rankingThreePointsAverage
            : null;
    });


    // =========================================
    // CLASSER LES JOUEURS
    // DU MEILLEUR AU MOINS BON
    // =========================================

    rankedPlayers.sort((a, b) => {

        // LES JOUEURS SANS MATCHS À LA FIN
        if (a.rankingScore === null) return 1;
        if (b.rankingScore === null) return -1;

        // COMPARER LE SCORE COMBINÉ
        if (b.rankingScore !== a.rankingScore) {
            return b.rankingScore - a.rankingScore;
        }

        // EN CAS D'ÉGALITÉ : COMPARER LE TOTAL DES POINTS
        return b.rankingTotalPoints - a.rankingTotalPoints;
    });


    // =========================================
    // AFFICHER LE MESSAGE SI AUCUN JOUEUR
    // =========================================

    rankingEmpty.hidden = rankedPlayers.length > 0;


    // =========================================
    // CRÉER CHAQUE LIGNE DU CLASSEMENT
    // =========================================

    rankedPlayers.forEach((player, index) => {

        const rankingRow = document.createElement('div');
        rankingRow.classList.add('ranking-row');


        // NUMÉRO DU CLASSEMENT
        const rank = document.createElement('div');
        rank.classList.add('ranking-position');
        rank.textContent = index + 1;


        // COULEURS DES TROIS PREMIERS
        if (index === 0) {
            rank.classList.add('gold');
        } else if (index === 1) {
            rank.classList.add('silver');
        } else if (index === 2) {
            rank.classList.add('bronze');
        }


        // NOM DU JOUEUR
        const playerName = document.createElement('div');
        playerName.classList.add('ranking-player');
        playerName.textContent = player.name;


        // MOYENNE DE POINTS
        const averagePoints = document.createElement('div');
        averagePoints.classList.add('ranking-average');

        averagePoints.textContent = player.rankingAverage !== null
            ? player.rankingAverage.toFixed(2).replace('.', ',') + ' pts'
            : '—';


        // ASSEMBLER LA LIGNE (sans moyenne des 3 points)
        rankingRow.append(
            rank,
            playerName,
            averagePoints
        );


        // AJOUTER LA LIGNE AU CLASSEMENT
        rankingList.appendChild(rankingRow);

    });

    // =========================================
    // CLASSEMENT CUMULÉ DES 3 POINTS
    // =========================================

    threePointsRankingList.innerHTML = '';

    const threePointsPlayers = [...players].map((player) => {
        const matches = Array.isArray(player.matches) ? player.matches : [];
        const totalThreePoints = matches.reduce((total, match) => {
            return total + Number(match.threePoints || 0);
        }, 0);
        return { ...player, totalThreePoints };
    }).sort((a, b) => b.totalThreePoints - a.totalThreePoints);

    threePointsPlayers.forEach((player, index) => {
        const row = document.createElement('div');
        row.classList.add('ranking-row', 'ranking-three-row');

        const rank = document.createElement('div');
        rank.classList.add('ranking-position');
        rank.textContent = index + 1;
        if (index === 0) rank.classList.add('gold');
        else if (index === 1) rank.classList.add('silver');
        else if (index === 2) rank.classList.add('bronze');

        const name = document.createElement('div');
        name.classList.add('ranking-player');
        name.textContent = player.name;

        const total = document.createElement('div');
        total.classList.add('ranking-average', 'ranking-three-total');
        total.textContent = `${player.totalThreePoints} 3PTS`;

        row.append(rank, name, total);
        threePointsRankingList.appendChild(row);
    });


}


/* =================================
    AJOUTER UN NOUVEAU JOUEUR
================================= */

playerForm.addEventListener('submit', async (event) => {

    // Empêcher le rechargement de la page
    event.preventDefault();

    // RÉCUPÉRER LES INFORMATIONS
    const name = document.getElementById('playerName').value.trim();
    const number = Number(
        document.getElementById('playerNumber').value
    );

    const age = document.getElementById('playerAge').value;
    const position = document.getElementById('playerPosition').value;
    const height = document.getElementById('playerHeight').value;
    const description = document.getElementById('playerDescription').value.trim();

    // VÉRIFIER LE NUMÉRO
    const numberExists = players.some((player) => {
        return Number(player.number) === number;
    });

    if (numberExists) {
        alert('Ce numéro de maillot est déjà utilisé !');
        return;
    }

    // RÉCUPÉRER LA PHOTO
    const imageFile = playerImage.files[0];
    let imageData = '';

    if (imageFile) {
        try {
            imageData = await compressImage(imageFile);
        } catch (error) {
            alert('Impossible de charger cette image.');
            return;
        }
    }

    // CRÉER LE NOUVEAU JOUEUR
    const newPlayer = {
        id: `${Date.now()}-${Math.random()}`,
        name: name,
        number: number,
        age: age,
        position: position,
        height: height,
        description: description,
        image: imageData
    };

    // AJOUTER LE JOUEUR AU TABLEAU
    players.push(newPlayer);

    // ENREGISTRER LES JOUEURS
    try {
        await BasketStatsCloud.save(players);
    } catch (error) {

        // Annuler l'ajout si le stockage est plein
        players.pop();

        alert(
            'Le stockage du navigateur est plein. Essaie avec une image plus légère.'
        );

        return;
    }

    // ACTUALISER LES CARTES
    displayPlayers();
    displayRanking();

    // RÉINITIALISER LE FORMULAIRE
    playerForm.reset();
    imagePreview.hidden = true;
    previewImg.src = '';

    // FERMER LA MODAL
    playerModal.hidden = true;
});


// AFFICHER LES JOUEURS AU DÉMARRAGE

displayPlayers();
displayRanking();


/* =================================
    RECHERCHER UN JOUEUR
================================= */

searchPlayer.addEventListener('input', () => {
    const searchText = searchPlayer.value.toLowerCase().trim();

    const playerCards = document.querySelectorAll('.player-card');

    playerCards.forEach((card) => {
        const playerName = card.querySelector('h3').textContent.toLowerCase();

        if (playerName.includes(searchText)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});


/* =================================
    MESSAGE SI AUCUN JOUEUR N'EST TROUVÉ
================================= */

searchPlayer.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const visiblePlayers = [...document.querySelectorAll('.player-card')]
            .filter((card) => card.style.display !== 'none');

        if (visiblePlayers.length === 0) {
            alert('Pas de joueur avec ce nom.');
        }
    }
});


/* =========================================
    SAISIE CENTRALISÉE DES MATCHS
========================================= */

const globalMatchForm = document.getElementById('globalMatchForm');

if (globalMatchForm) {

    const matchTableBody = document.getElementById('matchTableBody');
    const addMatchRowButton = document.getElementById('addMatchRow');

    const globalMatchTeam = document.getElementById('globalMatchTeam');
    const globalMatchOpponent = document.getElementById('globalMatchOpponent');
    const globalMatchDate = document.getElementById('globalMatchDate');


    // RÉCUPÉRER LES JOUEURS
    function getMatchPlayers() {
        return players;
    }


    // CRÉER UNE LIGNE DU TABLEAU
    function createMatchRow() {

        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="match-player-cell">
                <select class="match-player-select" required>
                    <option value="">Choisir un joueur</option>
                </select>
            </td>

            <td>
                <input
                    type="number"
                    class="match-minutes-input"
                    min="0"
                    step="1"
                    placeholder="Min"
                    required
                >
            </td>

            <td>
                <input
                    type="number"
                    class="match-points-input"
                    min="0"
                    step="1"
                    placeholder="Pts"
                    required
                >
            </td>

            <!-- 3 POINTS -->
            <td>
                <input
                    type="number"
                    class="match-three-points-input"
                    min="0"
                    step="1"
                    value="0"
                    placeholder="3PTS"
                    required
                >
            </td>

            <!-- LANCERS FRANCS -->
            <td>
                <input
                    type="number"
                    class="match-free-throws-input"
                    min="0"
                    step="1"
                    value="0"
                    placeholder="LF"
                    required
                >
            </td>

            <!-- FAUTES -->
            <td>
                <input
                    type="number"
                    class="match-fouls-input"
                    min="0"
                    step="1"
                    value="0"
                    placeholder="F"
                    required
                >
            </td>

            <!-- SUPPRIMER LA LIGNE -->
            <td class="match-row-action-cell">
                <button
                    type="button"
                    class="remove-match-row"
                    aria-label="Supprimer cette ligne"
                    title="Supprimer cette ligne"
                >
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;


        // RÉCUPÉRER LE SELECT DE LA LIGNE
        const playerSelect = row.querySelector('.match-player-select');


        // AJOUTER LES JOUEURS AU SELECT
        refreshMatchPlayerOptions();


        // SUPPRIMER LA LIGNE
        const removeButton = row.querySelector('.remove-match-row');

        removeButton.addEventListener('click', () => {

            // Garder au minimum une ligne
            if (matchTableBody.children.length > 1) {
                row.remove();
                refreshMatchPlayerOptions();
            }

        });


        // AJOUTER LA LIGNE AU TABLEAU
        matchTableBody.appendChild(row);

        // Remplir le select de cette nouvelle ligne
        fillPlayerSelect(playerSelect);

        // Actualiser les options de toutes les lignes
        refreshMatchPlayerOptions();

    }
        // REMPLIR UN SELECT AVEC LES JOUEURS
    function fillPlayerSelect(select) {

        const players = getMatchPlayers();

        // Garder la sélection actuelle
        const currentValue = select.value;

        // Réinitialiser les options
        select.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Choisir un joueur';
        select.appendChild(placeholder);

        // Ajouter tous les joueurs
        players.forEach(player => {

            const option = document.createElement('option');

            option.value = player.id;
            option.textContent = player.name;

            select.appendChild(option);

        });

        // Restaurer la sélection
        select.value = currentValue;

    }


    // ACTUALISER LES SELECTS DU TABLEAU
    function refreshMatchPlayerOptions() {

        const selects = matchTableBody.querySelectorAll('.match-player-select');

        // Récupérer les joueurs déjà sélectionnés
        const selectedPlayers = Array.from(selects)
            .map(select => select.value)
            .filter(value => value !== '');

        selects.forEach(select => {

            fillPlayerSelect(select);

            const currentValue = select.value;

            Array.from(select.options).forEach(option => {

                if (
                    option.value !== '' &&
                    selectedPlayers.includes(option.value) &&
                    option.value !== currentValue
                ) {
                    option.disabled = true;
                }

            });

        });

    }


    // AJOUTER UNE LIGNE
    addMatchRowButton.addEventListener('click', () => {
        createMatchRow();
    });


    // AJOUTER UNE LIGNE LORSQU'ON CHANGE DE JOUEUR
    matchTableBody.addEventListener('change', event => {

        if (event.target.classList.contains('match-player-select')) {
            refreshMatchPlayerOptions();
        }

    });


    // CRÉER LA PREMIÈRE LIGNE AUTOMATIQUEMENT
    createMatchRow();


    // VALIDER LE MATCH
    globalMatchForm.addEventListener('submit', async event => {

        event.preventDefault();

        const players = getMatchPlayers();

        const rows = Array.from(
            matchTableBody.querySelectorAll('tr')
        );

        const team = globalMatchTeam.value.trim();
        const opponent = globalMatchOpponent.value.trim();
        const date = globalMatchDate.value;


        // =========================================
        // RÉCUPÉRER LES STATISTIQUES DE CHAQUE JOUEUR
        // =========================================

        const matchEntries = rows.map(row => {

            return {
                playerId: row.querySelector('.match-player-select').value,

                // Temps de jeu
                minutes: Number(
                    row.querySelector('.match-minutes-input').value
                ),

                // Points totaux
                points: Number(
                    row.querySelector('.match-points-input').value
                ),

                // Tirs à 3 points réussis
                threePoints: Number(
                    row.querySelector('.match-three-points-input').value
                ),

                // Lancers francs réussis
                freeThrows: Number(
                    row.querySelector('.match-free-throws-input').value
                ),

                // Fautes commises
                fouls: Number(
                    row.querySelector('.match-fouls-input').value
                )
            };

        });


        // VÉRIFICATIONS
        if (matchEntries.length === 0) {
            alert('Ajoute au moins un joueur.');
            return;
        }

        if (matchEntries.some(entry => entry.playerId === '')) {
            alert('Sélectionne un joueur sur chaque ligne.');
            return;
        }


        // IDENTIFIANT COMMUN DU MATCH
        const matchId = `${Date.now()}-${Math.random()}`;


        // ENREGISTRER LES STATISTIQUES POUR CHAQUE JOUEUR
        matchEntries.forEach(entry => {

            const player = players.find(
                item => String(item.id) === String(entry.playerId)
            );

            if (!player) return;

            // Créer le tableau des matchs si nécessaire
            if (!Array.isArray(player.matches)) {
                player.matches = [];
            }

            // Enregistrer le match et ses statistiques
            player.matches.push({
                id: matchId,
                name: `${team} vs ${opponent}`,

                // Statistiques individuelles
                points: entry.points,
                threePoints: entry.threePoints,
                freeThrows: entry.freeThrows,
                fouls: entry.fouls,

                // Informations du match
                team: team,
                opponent: opponent,
                minutes: entry.minutes,
                date: date
            });

        });


        // SAUVEGARDER DANS LE LOCALSTORAGE
        try {
            await BasketStatsCloud.save(players);
        } catch (error) {
            console.error(error);
            alert('Le match n’a pas pu être enregistré en ligne : ' + error.message);
            return;
        }

        // CONFIRMATION
        alert('Match enregistré avec succès !');


        // RÉINITIALISER LE FORMULAIRE
        globalMatchForm.reset();


        // VIDER LE TABLEAU
        matchTableBody.innerHTML = '';


        // RECRÉER UNE LIGNE
        createMatchRow();

    });

}