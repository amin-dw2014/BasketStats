/* =========================================
   BASKETSTATS CLIENT — CONSULTATION UNIQUEMENT
   Les données sont lues depuis le stockage local.
   Aucune fonction d'ajout, de modification ou de suppression.
========================================= */

const rankingList = document.getElementById('rankingList');
const rankingEmpty = document.getElementById('rankingEmpty');
const threePointsRankingList = document.getElementById('threePointsRankingList');
const playersList = document.getElementById('playersList');
const emptyPlayers = document.querySelector('.no-players');
const searchPlayer = document.getElementById('searchPlayer');

/* NAVIGATION ENTRE LES PAGES */
const links = document.querySelectorAll('[data-page]');
const pages = document.querySelectorAll('.page');
const burger = document.querySelector('.responsive-nav');
const menu = document.querySelector('.responsive-menu');

let changingPage = false;

links.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();

        const targetPage = document.getElementById(link.dataset.page);
        const currentPage = document.querySelector('.page.active');

        if (!targetPage || targetPage === currentPage || changingPage) return;

        changingPage = true;

        if (currentPage) {
            currentPage.classList.add('fade-out');
            currentPage.classList.remove('active');
        }

        setTimeout(() => {
            if (currentPage) currentPage.classList.remove('fade-out');
            targetPage.classList.add('active');
            changingPage = false;
        }, 300);

        history.replaceState(null, '', link.getAttribute('href'));

        if (menu) menu.classList.remove('active');
        if (burger) {
            burger.innerHTML = '<i class="fa-solid fa-bars"></i>';
            burger.setAttribute('aria-label', 'Ouvrir le menu');
        }
    });
});

/* MENU BURGER */
if (burger && menu) {
    burger.addEventListener('click', () => {
        menu.classList.toggle('active');
        const open = menu.classList.contains('active');
        burger.innerHTML = open
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';
        burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
}

/* DONNÉES : LECTURE SEULE */
let players = [];
try {
    const stored = JSON.parse(localStorage.getItem('basketPlayers') || '[]');
    players = Array.isArray(stored) ? stored : [];
} catch (error) {
    console.error('Impossible de lire les données BasketStats :', error);
    players = [];
}

/* AFFICHER LES JOUEURS — SANS BOUTON DE SUPPRESSION */
function displayPlayers() {
    if (!playersList) return;

    playersList.innerHTML = '';

    if (emptyPlayers) emptyPlayers.hidden = players.length > 0;

    players.forEach((player) => {
        const card = document.createElement('div');
        card.classList.add('player-card');
        card.addEventListener('click', () => {
            window.location.href = `player.html?id=${encodeURIComponent(player.id)}`;
        });

        const photo = document.createElement('div');
        photo.classList.add('player-card-photo');

        if (player.image) {
            const image = document.createElement('img');
            image.src = player.image;
            image.alt = `Photo de ${player.name}`;
            image.classList.add('player-card-image');
            photo.appendChild(image);
        } else {
            const noImage = document.createElement('div');
            noImage.classList.add('player-card-no-image');
            const icon = document.createElement('i');
            icon.classList.add('fa-solid', 'fa-basketball');
            noImage.appendChild(icon);
            photo.appendChild(noImage);
        }

        const content = document.createElement('div');
        content.classList.add('player-card-content');

        const name = document.createElement('h3');
        name.textContent = player.name || 'Joueur';

        const number = document.createElement('span');
        number.classList.add('player-number-badge');
        number.textContent = `N° ${player.number ?? '—'}`;

        const details = document.createElement('div');
        details.classList.add('player-details');

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

        details.append(
            createDetail('Position', player.position),
            createDetail('Âge', player.age ? `${player.age} ans` : ''),
            createDetail('Taille', player.height ? `${player.height} cm` : '')
        );

        content.append(name, number, details);

        if (player.description) {
            const description = document.createElement('p');
            description.classList.add('player-card-description');
            description.textContent = player.description;
            content.appendChild(description);
        }

        card.append(photo, content);
        playersList.appendChild(card);
    });
}

/* AFFICHER LES CLASSEMENTS */
function displayRanking() {
    if (!rankingList || !threePointsRankingList) return;

    rankingList.innerHTML = '';
    threePointsRankingList.innerHTML = '';

    const rankedPlayers = players.map((player) => {
        const matches = Array.isArray(player.matches) ? player.matches : [];
        const totalPoints = matches.reduce((sum, match) => sum + Number(match.points || 0), 0);
        const totalThreePoints = matches.reduce((sum, match) => sum + Number(match.threePoints || 0), 0);
        const totalMatches = matches.length;

        return {
            ...player,
            rankingAverage: totalMatches ? totalPoints / totalMatches : null,
            rankingTotalPoints: totalPoints,
            rankingScore: totalMatches ? (totalPoints / totalMatches) + (totalThreePoints / totalMatches) : null,
            totalThreePoints
        };
    });

    rankedPlayers.sort((a, b) => {
        if (a.rankingScore === null) return 1;
        if (b.rankingScore === null) return -1;
        if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
        return b.rankingTotalPoints - a.rankingTotalPoints;
    });

    if (rankingEmpty) rankingEmpty.hidden = rankedPlayers.length > 0;

    rankedPlayers.forEach((player, index) => {
        const row = document.createElement('div');
        row.classList.add('ranking-row');

        const rank = document.createElement('div');
        rank.classList.add('ranking-position');
        rank.textContent = index + 1;
        if (index === 0) rank.classList.add('gold');
        else if (index === 1) rank.classList.add('silver');
        else if (index === 2) rank.classList.add('bronze');

        const name = document.createElement('div');
        name.classList.add('ranking-player');
        name.textContent = player.name;

        const average = document.createElement('div');
        average.classList.add('ranking-average');
        average.textContent = player.rankingAverage !== null
            ? `${player.rankingAverage.toFixed(2).replace('.', ',')} pts`
            : '—';

        row.append(rank, name, average);
        rankingList.appendChild(row);
    });

    const threePointPlayers = [...rankedPlayers].sort((a, b) => b.totalThreePoints - a.totalThreePoints);
    threePointPlayers.forEach((player, index) => {
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

/* RECHERCHE DES JOUEURS */
if (searchPlayer) {
    searchPlayer.addEventListener('input', () => {
        const query = searchPlayer.value.toLowerCase().trim();
        document.querySelectorAll('.player-card').forEach((card) => {
            const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
            card.style.display = name.includes(query) ? 'block' : 'none';
        });
    });

    searchPlayer.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const visible = [...document.querySelectorAll('.player-card')]
            .some((card) => card.style.display !== 'none');
        if (!visible) alert('Pas de joueur avec ce nom.');
    });
}

displayPlayers();
displayRanking();
