/* BasketStats — connexion Supabase
   Client : lecture publique. Admin : connexion obligatoire.
*/
(() => {
  const CONFIG = {
    url: 'https://sxpddmjyuryrodrlgfyl.supabase.co',
    key: 'sb_publishable_9p8_O_L59YUmYnr5wtOg_A_bBhjgQpk',
    adminEmail: 'salim.aldj@gmail.com',
    table: 'site_data'
  };
  const isAdmin = location.pathname.includes('/admin/');
  const appFile = location.pathname.endsWith('/player.html') ? 'player.js' : 'script.js';

  function showMessage(message, isError=false) {
    let el = document.getElementById('bs-cloud-message');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bs-cloud-message';
      el.style.cssText = 'position:fixed;z-index:100000;bottom:16px;left:50%;transform:translateX(-50%);max-width:90%;padding:12px 18px;border-radius:10px;background:#172033;color:white;font:14px Arial,sans-serif;box-shadow:0 4px 20px #0003';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.background = isError ? '#9f2525' : '#172033';
    el.hidden = false;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.hidden = true; }, 5000);
  }

  function loadScript(file) {
    const script = document.createElement('script');
    script.src = file;
    script.onerror = () => showMessage('Impossible de charger le fichier ' + file, true);
    document.body.appendChild(script);
  }

  function addLoginStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #bs-login-cover{position:fixed;inset:0;z-index:99999;background:rgba(9,15,28,.94);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif}
      #bs-login-card{width:min(420px,100%);background:#fff;color:#182033;border-radius:18px;padding:28px;box-shadow:0 18px 60px #0005}
      #bs-login-card h2{margin:0 0 8px;font-size:24px}#bs-login-card p{line-height:1.5;color:#596273}
      #bs-login-card label{display:block;margin:16px 0 6px;font-weight:600}#bs-login-card input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #cbd2dc;border-radius:8px;font-size:16px}
      #bs-login-card button{width:100%;margin-top:20px;padding:13px;border:0;border-radius:8px;background:#172f55;color:#fff;font-size:16px;font-weight:700;cursor:pointer}
      #bs-login-error{color:#b42318;min-height:20px;font-size:14px;margin-top:12px}
    `;
    document.head.appendChild(style);
  }

  function showLogin(supabase, initialMessage='') {
    addLoginStyles();
    const cover = document.createElement('div');
    cover.id = 'bs-login-cover';
    cover.innerHTML = `<form id="bs-login-card"><h2>BasketStats — Administration</h2><p>Connecte-toi avec le compte administrateur autorisé.</p><label for="bs-email">Adresse e-mail</label><input id="bs-email" type="email" autocomplete="username" required value="${CONFIG.adminEmail}"><label for="bs-password">Mot de passe</label><input id="bs-password" type="password" autocomplete="current-password" required><button type="submit">Se connecter</button><div id="bs-login-error" role="alert">${initialMessage}</div></form>`;
    document.body.appendChild(cover);
    cover.querySelector('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = cover.querySelector('button');
      const error = document.getElementById('bs-login-error');
      const email = document.getElementById('bs-email').value.trim().toLowerCase();
      const password = document.getElementById('bs-password').value;
      if (email !== CONFIG.adminEmail) { error.textContent = 'Cette adresse e-mail n’est pas autorisée.'; return; }
      button.disabled = true; button.textContent = 'Connexion…'; error.textContent = '';
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        error.textContent = 'Connexion impossible : vérifie le mot de passe et le compte Supabase.';
        button.disabled = false; button.textContent = 'Se connecter'; return;
      }
      cover.remove();
      await startAdmin(supabase);
    });
  }

  async function getPlayers(supabase) {
    const { data, error } = await supabase.from(CONFIG.table).select('data').eq('id', 1).single();
    if (error) throw error;
    if (!Array.isArray(data.data)) throw new Error('La colonne data de site_data ne contient pas un tableau.');
    return data.data;
  }

  function cachePlayers(players) {
    localStorage.setItem('basketPlayers', JSON.stringify(players));
  }

  async function startAdmin(supabase) {
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email?.toLowerCase();
    if (email !== CONFIG.adminEmail) {
      await supabase.auth.signOut();
      showLogin(supabase, 'Ce compte ne possède pas les droits administrateur.');
      return;
    }
    try {
      let players = await getPlayers(supabase);
      // Migration protégée : si Supabase est vide mais que cet ancien navigateur
      // possède encore les données localStorage, proposer de les importer.
      let legacyPlayers = [];
      try {
        const oldValue = JSON.parse(localStorage.getItem('basketPlayers') || '[]');
        if (Array.isArray(oldValue)) legacyPlayers = oldValue;
      } catch (_) {}
      if (players.length === 0 && legacyPlayers.length > 0) {
        const shouldImport = window.confirm(
          'La base Supabase est vide, mais ce navigateur contient ' + legacyPlayers.length +
          ' joueur(s) enregistrés dans l’ancienne version.\n\n' +
          'Veux-tu les transférer maintenant dans la base commune BasketStats ?'
        );
        if (shouldImport) {
          const { error: importError } = await supabase.from(CONFIG.table).update({ data: legacyPlayers }).eq('id', 1);
          if (importError) throw importError;
          players = legacyPlayers;
          showMessage('Anciennes données importées dans Supabase.');
        } else {
          // Ne pas écraser les anciennes données locales si l'utilisateur reporte l'import.
          players = legacyPlayers;
        }
      }
      cachePlayers(players);
      window.BasketStatsCloud = {
        players,
        async save(nextPlayers) {
          const { data: current } = await supabase.auth.getUser();
          if (current?.user?.email?.toLowerCase() !== CONFIG.adminEmail) throw new Error('Session administrateur non autorisée.');
          const { error } = await supabase.from(CONFIG.table).update({ data: nextPlayers }).eq('id', 1);
          if (error) throw error;
          cachePlayers(nextPlayers);
          this.players = nextPlayers;
        },
        supabase,
        async signOut() { await supabase.auth.signOut(); location.reload(); }
      };
      loadScript(appFile);
      // Petit bouton discret pour fermer la session administrateur.
      const logout = document.createElement('button');
      logout.type = 'button'; logout.textContent = 'Déconnexion';
      logout.title = 'Fermer la session administrateur';
      logout.style.cssText = 'position:fixed;z-index:9000;right:12px;bottom:12px;padding:8px 12px;border:0;border-radius:8px;background:#26364f;color:white;cursor:pointer;font:13px Arial,sans-serif;opacity:.8';
      logout.addEventListener('click', () => window.BasketStatsCloud.signOut());
      document.body.appendChild(logout);
    } catch (error) {
      console.error(error);
      showMessage('Erreur de chargement Supabase : ' + (error.message || 'vérifie la table site_data et ses règles SQL.'), true);
    }
  }

  function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = resolve;
      script.onerror = () => reject(new Error('La bibliothèque Supabase n’a pas pu être chargée.'));
      document.head.appendChild(script);
    });
  }

  (async () => {
    try {
      await loadSupabaseLibrary();
      const supabase = window.supabase.createClient(CONFIG.url, CONFIG.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      if (isAdmin) {
        const { data } = await supabase.auth.getSession();
        if (data.session) await startAdmin(supabase);
        else showLogin(supabase);
      } else {
        const players = await getPlayers(supabase);
        cachePlayers(players);
        window.BasketStatsCloud = { players, supabase };
        loadScript(appFile);
        // Le site public vérifie périodiquement si l'administrateur a publié de nouvelles données.
        let lastSnapshot = JSON.stringify(players);
        setInterval(async () => {
          try {
            const fresh = await getPlayers(supabase);
            const snapshot = JSON.stringify(fresh);
            if (snapshot !== lastSnapshot) {
              lastSnapshot = snapshot;
              cachePlayers(fresh);
              location.reload();
            }
          } catch (error) { console.warn('Actualisation BasketStats impossible :', error); }
        }, 20000);
      }
    } catch (error) {
      console.error(error);
      showMessage('Connexion à BasketStats impossible : ' + (error.message || 'vérifie ta connexion.'), true);
    }
  })();
})();
