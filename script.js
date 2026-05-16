const toastElement = document.getElementById('toast');
let toastTimeout = null;
const rotationPeriodDays = 15;
const teacherEmail = 'williammacauley25@outlook.com';

function showToast(message) {
  if (!toastElement) {
    alert(message);
    return;
  }

  toastElement.textContent = message;
  toastElement.classList.remove('hidden');
  toastElement.classList.add('visible');

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    toastElement.classList.remove('visible');
    setTimeout(() => toastElement.classList.add('hidden'), 250);
  }, 2200);
}

document.querySelectorAll('a[href="#"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    showToast('Cette page est en construction, reviens bientôt !');
  });
});

function getExerciseMode() {
  return localStorage.getItem('exerciseMode') || 'appareil';
}

function setExerciseMode(mode) {
  localStorage.setItem('exerciseMode', mode);
}

function hashString(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return crypto.subtle.digest('SHA-256', data)
    .then(hashBuffer => {
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
}

function renderModeSelection(section, grade, subject) {
  let selectionContainer = document.getElementById('exercise-mode-selection');
  const mode = getExerciseMode();

  if (!selectionContainer) {
    selectionContainer = document.createElement('div');
    selectionContainer.id = 'exercise-mode-selection';
    selectionContainer.className = 'exercise-mode-selection';
    section.insertBefore(selectionContainer, section.firstChild);
  }

  selectionContainer.innerHTML = `
    <div class="mode-choice">
      <span>Choisis ton mode de travail :</span>
      <button type="button" class="mode-button ${mode === 'appareil' ? 'active' : ''}" data-mode="appareil">Sur l'appareil</button>
      <button type="button" class="mode-button ${mode === 'cahier' ? 'active' : ''}" data-mode="cahier">Dans le cahier</button>
    </div>
    <p class="mode-note">Après avoir choisi, fais l'exercice dans le mode sélectionné puis clique sur "Terminé" pour envoyer une notification.</p>
  `;

  selectionContainer.querySelectorAll('.mode-button').forEach(button => {
    button.addEventListener('click', () => {
      setExerciseMode(button.dataset.mode);
      renderModeSelection(section, grade, subject);
      const message = button.dataset.mode === 'cahier'
        ? 'Tu travailles maintenant dans le cahier.'
        : 'Tu travailles maintenant sur l’appareil.';
      showToast(message);
    });
  });
}

function notifyTeacher(exerciseNumber, grade, subject, mode) {
  const subjectText = `Exercice terminé : ${grade} ${subject}`;
  const bodyText = `J'ai terminé l'exercice ${exerciseNumber} en ${grade} ${subject}.\nMode choisi : ${mode === 'cahier' ? 'dans le cahier' : 'sur l\'appareil'}.\n`;
  const mailtoLink = `mailto:${teacherEmail}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;

  showToast('Ton mail est prêt, vérifie ta messagerie.');
  window.location.href = mailtoLink;
}

function attachExerciseButtons(grade, subject) {
  document.querySelectorAll('.exercise-done-btn').forEach(button => {
    button.addEventListener('click', () => {
      const exerciseNumber = Number(button.dataset.exerciseIndex) + 1;
      const mode = getExerciseMode();
      notifyTeacher(exerciseNumber, grade, subject, mode);
    });
  });
}

// Authentication functions
function validateUsername(username) {
  if (!username || username.length < 3) {
    return "Le nom d'utilisateur doit contenir au moins 3 caractères.";
  }
  if (username.length > 20) {
    return "Le nom d'utilisateur ne peut pas dépasser 20 caractères.";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores.";
  }
  return null; // Valid
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (password.length > 50) {
    return "Le mot de passe ne peut pas dépasser 50 caractères.";
  }
  // Check for at least one letter and one number
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  }
  return null; // Valid
}

function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  return strength; // 0-5
}

function isLoggedIn() {
  return localStorage.getItem('currentUser') !== null;
}

function getCurrentUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

function getAllUsers() {
  try {
    return JSON.parse(localStorage.getItem('users') || '[]');
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function updateLastLogin(username) {
  const users = getAllUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.lastLoginAt = new Date().toISOString();
    saveUsers(users);
  }
}

function formatDateTime(value) {
  if (!value) {
    return 'Jamais';
  }
  const date = new Date(value);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderAdminUsersPanel() {
  const panel = document.getElementById('admin-users-panel');
  const list = document.getElementById('admin-user-list');
  if (!panel || !list) return;

  const users = getAllUsers().filter(u => u.username !== 'Invité');
  list.innerHTML = '';

  users.sort((a, b) => {
    if (!a.lastLoginAt) return 1;
    if (!b.lastLoginAt) return -1;
    return new Date(b.lastLoginAt) - new Date(a.lastLoginAt);
  });

  users.forEach(user => {
    const tr = document.createElement('tr');
    const status = user.lastLoginAt && (new Date() - new Date(user.lastLoginAt) < 60 * 60 * 1000)
      ? 'Actif' : 'Inactif';
    const statusClass = status === 'Actif' ? 'user-status-active' : 'user-status-idle';
    const nameCell = document.createElement('td');
    nameCell.textContent = user.username;
    const lastLoginCell = document.createElement('td');
    lastLoginCell.textContent = formatDateTime(user.lastLoginAt);
    const roleCell = document.createElement('td');
    roleCell.textContent = user.creator ? 'Créateur' : user.guest ? 'Invité' : 'Utilisateur';
    if (user.creator) {
      roleCell.className = 'user-role-creator';
    } else if (user.guest) {
      roleCell.className = 'user-role-guest';
    }
    const statusCell = document.createElement('td');
    statusCell.textContent = status;
    statusCell.className = statusClass;

    tr.appendChild(nameCell);
    tr.appendChild(lastLoginCell);
    tr.appendChild(roleCell);
    tr.appendChild(statusCell);
    list.appendChild(tr);
  });

  panel.classList.remove('hidden');
}

function isCreatorModeEnabled() {
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return search.includes('admin=1') || search.includes('creator=1') || hash === '#admin' || hash === '#creator';
}

async function login(username, password) {
  const users = getAllUsers();
  const user = users.find(u => u.username === username);
  const hashedPassword = await hashString(password);

  if (user && (user.passwordHash === hashedPassword || user.password === password)) {
    if (user.creator && !isCreatorModeEnabled()) {
      return false;
    }

    if (user.password && !user.passwordHash) {
      user.passwordHash = hashedPassword;
      delete user.password;
      saveUsers(users);
    }

    updateLastLogin(username);
    const safeUser = {
      username: user.username,
      guest: user.guest,
      creator: user.creator,
      id: user.id || Date.now().toString(),
      lastLoginAt: user.lastLoginAt
    };
    localStorage.setItem('currentUser', JSON.stringify(safeUser));
    return true;
  }

  if (isCreatorModeEnabled() && username === 'admin' && password === 'admin2026') {
    await ensureCreatorAccount();
    const creatorUser = getAllUsers().find(u => u.username === 'admin');
    if (creatorUser) {
      updateLastLogin('admin');
      const safeUser = {
        username: creatorUser.username,
        creator: true,
        id: creatorUser.id || 'creator',
        lastLoginAt: creatorUser.lastLoginAt
      };
      localStorage.setItem('currentUser', JSON.stringify(safeUser));
      return true;
    }
  }

  return false;
}

async function register(username, password, confirmPassword) {
  // Validate inputs
  const usernameError = validateUsername(username);
  if (usernameError) {
    return { success: false, error: usernameError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Les mots de passe ne correspondent pas." };
  }

  const users = JSON.parse(localStorage.getItem('users') || '[]');
  if (users.find(u => u.username === username)) {
    return { success: false, error: "Ce nom d'utilisateur existe déjà." };
  }

  const passwordHash = await hashString(password);
  const newUser = {
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    id: Date.now().toString()
  };
  users.push(newUser);
  saveUsers(users);
  const safeUser = {
    username: newUser.username,
    id: newUser.id,
    createdAt: newUser.createdAt,
    lastLoginAt: newUser.lastLoginAt
  };
  localStorage.setItem('currentUser', JSON.stringify(safeUser));
  return { success: true };
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

function loginGuest() {
  const guestUser = {
    username: 'Invité',
    guest: true,
    createdAt: new Date().toISOString(),
    id: 'guest'
  };
  localStorage.setItem('currentUser', JSON.stringify(guestUser));
  return guestUser;
}

async function ensureCreatorAccount() {
  let users;
  try {
    users = JSON.parse(localStorage.getItem('users') || '[]');
  } catch (error) {
    users = [];
  }

  let creator = users.find(u => u.username === 'admin');
  if (!creator) {
    creator = {
      username: 'admin',
      passwordHash: await hashString('admin2026'),
      creator: true,
      createdAt: new Date().toISOString(),
      id: 'creator'
    };
    users.push(creator);
    saveUsers(users);
    return;
  }

  const defaultHash = await hashString('admin2026');
  const shouldUpdate = creator.passwordHash !== defaultHash || !creator.creator;
  if (shouldUpdate) {
    creator.passwordHash = defaultHash;
    creator.creator = true;
    if (!creator.id) {
      creator.id = 'creator';
    }
    delete creator.password;
    saveUsers(users);
  }
}

function checkAuth() {
  if (!isLoggedIn() && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
  }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
  await ensureCreatorAccount();
  checkAuth();

  // Display user info if logged in or show login button if not
  const user = getCurrentUser();
  const userInfo = document.getElementById('user-info');
  const usernameDisplay = document.getElementById('username-display');
  const logoutBtn = document.getElementById('logout-btn');
  const loginBtn = document.getElementById('login-btn');

  if (user) {
    if (userInfo && usernameDisplay) {
      usernameDisplay.textContent = user.username;
      userInfo.style.display = 'block';
    }
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
    if (loginBtn) {
      loginBtn.style.display = 'none';
    }
    if (user.creator) {
      renderAdminUsersPanel();
    }
  } else {
    if (loginBtn) {
      loginBtn.style.display = 'inline-block';
    }
  }
});

const pageData = {
  '5e-maths': [
    {
      intro: 'Série longue de 30 exercices de 5e en calcul, fractions, géométrie et problèmes.',
      exercises: [
        "Calcule : 25 + 37.",
        "Calcule : 18 + 46.",
        "Résous : 123 - 57.",
        "Résous : 75 - 29.",
        "Calcule : 12 × 8.",
        "Calcule : 6 × 9.",
        "Divise : 56 ÷ 7.",
        "Divise : 72 ÷ 8.",
        "Calcule : 2/5 + 1/5.",
        "Calcule : 3/4 - 1/4.",
        "Multiplie : 1/2 × 4.",
        "Additionne : 3/5 + 2/5.",
        "Convertis 150 centimes en euros.",
        "Écris 4,25 sous forme de fraction.",
        "Calcule le périmètre d’un rectangle de 5 cm sur 9 cm.",
        "Calcule l’aire d’un rectangle de 6 cm sur 3 cm.",
        "Calcule le périmètre d’un triangle de côtés 4 cm, 5 cm et 6 cm.",
        "Combien fait la moitié de 80 ?",
        "Calcule 25 % de 200.",
        "Calcule 15 % de 120.",
        "Si 3 crayons coûtent 6 €, combien coûte 1 crayon ?",
        "Si un bus transporte 32 élèves en 4 voyages, combien d’élèves sont transportés ?",
        "Additionne : 4,5 + 3,75.",
        "Soustrais : 7,2 - 2,8.",
        "Résous : x + 8 = 15.",
        "Résous : 2x = 14.",
        "Calcule : 5 × 4 + 18.",
        "Calcule : 60 - (15 + 10).",
        "Calcule : 9 × 7.",
        "Combien font 2/3 + 1/3 ?"
      ],
      solutions: [
        "62.",
        "64.",
        "66.",
        "46.",
        "96.",
        "54.",
        "8.",
        "9.",
        "3/5.",
        "1/2.",
        "2.",
        "1.",
        "1,50 €.",
        "17/4.",
        "28 cm.",
        "18 cm².",
        "15 cm.",
        "40.",
        "50.",
        "18.",
        "2 €.",
        "128 élèves.",
        "8,25.",
        "4,4.",
        "x = 7.",
        "x = 7.",
        "38.",
        "35.",
        "63.",
        "1."
      ]
    },
    {
      intro: 'Cycle renouvelé 5e maths : nouvelle quinzaine, nouveaux problèmes.',
      exercises: [
        "Calcule : 32 + 19.",
        "Calcule : 46 + 27.",
        "Résous : 200 - 85.",
        "Résous : 90 - 34.",
        "Calcule : 14 × 7.",
        "Calcule : 8 × 8.",
        "Divise : 81 ÷ 9.",
        "Divise : 56 ÷ 8.",
        "Calcule : 1/3 + 2/3.",
        "Calcule : 5/6 - 1/6.",
        "Multiplie : 2/3 × 3.",
        "Additionne : 4/5 + 1/5.",
        "Convertis 320 centimes en euros.",
        "Écris 7,5 sous forme de fraction.",
        "Calcule le périmètre d’un rectangle de 8 cm sur 12 cm.",
        "Calcule l’aire d’un rectangle de 9 cm sur 4 cm.",
        "Calcule le périmètre d’un triangle de côtés 3 cm, 4 cm et 5 cm.",
        "Calcule 30 % de 120.",
        "Calcule 10 % de 250.",
        "Si 2 stylos coûtent 4 €, combien coûtent 7 stylos ?",
        "Si un bus transporte 28 élèves en 5 voyages, combien d’élèves sont transportés ?",
        "Additionne : 3,25 + 2,1.",
        "Soustrais : 9,8 - 4,3.",
        "Résous : x - 7 = 12.",
        "Résous : 3x = 18.",
        "Calcule : 7 × 5 + 16.",
        "Calcule : 54 - (20 + 9).",
        "Calcule : 11 × 6.",
        "Combien fait 4/5 + 1/10 ?"
      ],
      solutions: [
        "51.",
        "73.",
        "115.",
        "56.",
        "98.",
        "64.",
        "9.",
        "7.",
        "1.",
        "2/3.",
        "2.",
        "1.",
        "3,20 €.",
        "15/2.",
        "40 cm.",
        "36 cm².",
        "12 cm.",
        "36.",
        "25.",
        "14 €.",
        "140 élèves.",
        "5,35.",
        "5,5.",
        "x = 19.",
        "x = 6.",
        "51.",
        "25.",
        "66.",
        "9/10."
      ]
    }
  ],
  '5e-francais': [
    {
      intro: 'Série longue de 30 exercices de 5e en conjugaison, orthographe, accords et compréhension.',
      exercises: [
        "Identifie le verbe dans : « Le maître corrige les copies. »",
        "Accorde : « une fille (heureux) ».",
        "Écris le pluriel de : « un animal », « une écharpe », « un chapeau ».",
        "Transforme en négation : « Il fait ses devoirs. »",
        "Mets un point à la fin de : « Le chat dort »",
        "Remplace par un pronom : « Sophie lit un livre. »",
        "Choisis : « Son / Sont » devant « livre ».",
        "Donne le féminin de « acteur ».",
        "Écris « Je suis » au futur simple.",
        "Trouve l’adjectif dans : « Une grande maison ».",
        "Accorde : « les feuilles sont (vert) ».",
        "Conjugue « manger » au présent pour « il ».",
        "Trouve le sujet de : « Les oiseaux chantent. »",
        "Réécris au pluriel : « Le joli arbre ».",
        "Transforme en phrase interrogative : « Tu vas à l’école. »",
        "Synonyme de « rapide ».",
        "Définis : « un nom ».",
        "Donne un exemple de phrase exclamative.",
        "Complète : « Je ___ (être) content. »",
        "Choisis : « a / à » : « Je vais __ l’école. »",
        "Accorde : « deux maisons (bleu) ».",
        "Mets au pluriel : « un beau jardin ».",
        "Identifie le mot interrogatif dans : « Où vas-tu ? ».",
        "Donne le participe passé de « parler ».",
        "Remplace « les garçons » par un pronom.",
        "Écris « Il mange » au passé composé.",
        "Mets à l’impératif : « Tu fermes la porte. »",
        "Transforme en phrase interrogative : « Vous êtes prêts. »",
        "Trouve le verbe d’état dans : « Elle est contente. »",
        "Donne l’adjectif dans : « Un ciel bleu. »"
      ],
      solutions: [
        "corrige.",
        "heureuse.",
        "des animaux, des écharpes, des chapeaux.",
        "Il ne fait pas ses devoirs.",
        "Le chat dort.",
        "Elle lit un livre.",
        "Son livre.",
        "actrice.",
        "Je serai.",
        "grande.",
        "vertes.",
        "il mange.",
        "Les oiseaux.",
        "Les jolis arbres.",
        "Vas-tu à l’école ?",
        "vite.",
        "Un mot qui désigne une personne, un lieu ou une chose.",
        "Quel beau soleil !",
        "Je suis content.",
        "à.",
        "deux maisons bleues.",
        "de beaux jardins.",
        "Où.",
        "parlé.",
        "ils.",
        "Il a mangé.",
        "Ferme la porte.",
        "Êtes-vous prêts ?",
        "est.",
        "bleu."
      ]
    }
  ],
  '5e-svt': [
    {
      intro: 'Série longue de 30 exercices de 5e en SVT, Terre et physique élémentaire.',
      exercises: [
        "Quelle est la fonction principale des racines ?",
        "Quel est l’état de l’eau à 0°C ?",
        "Donne une force qui attire les objets vers la Terre.",
        "Quels sont les trois états de l’eau ?",
        "Donne un exemple d’animal vertébré.",
        "Donne un exemple de plante.",
        "Quel organe sert à voir ?",
        "Quel gaz compose l’air que nous respirons ?",
        "Vrai ou faux : le soleil est une étoile.",
        "Pourquoi la Terre tourne-t-elle autour du soleil ?",
        "Qu’est-ce qu’un habitat ?",
        "Quelle est la fonction des feuilles ?",
        "Donne un exemple d’organe du corps humain.",
        "Que signifie photosynthèse ?",
        "Pourquoi les feuilles sont-elles vertes ?",
        "Quel matériau est solide : l’eau ou le bois ?",
        "Quelle énergie fournit une ampoule électrique ?",
        "Pourquoi un objet flotte-t-il sur l’eau ?",
        "Donne un matériau conducteur de l’électricité.",
        "Donne un aliment riche en protéines.",
        "Pourquoi le corps a-t-il besoin d’eau ?",
        "Donne un des cinq sens.",
        "Qu’est-ce que le squelette ?",
        "Nomme une partie d’une plante.",
        "Qu’est-ce qu’un volcan ?",
        "Qu’est-ce qu’un fossile ?",
        "L’eau d’une plante est composée principalement de quel liquide ?",
        "Vrai ou faux : une plante fabrique sa propre nourriture.",
        "Donne un gaz que l’on respire.",
        "Pourquoi les animaux mangent-ils ?"
      ],
      solutions: [
        "Absorber l’eau et les minéraux du sol.",
        "L’eau est solide : la glace.",
        "La gravité.",
        "Solide, liquide, gaz.",
        "Un chien, un cheval, un poisson.",
        "Un arbre, une fleur.",
        "L’œil.",
        "L’azote.",
        "Vrai.",
        "Parce qu’elle tourne autour du soleil sous l’effet de la gravité.",
        "Le lieu où vit un animal ou une plante.",
        "Fabriquer de la nourriture grâce à la lumière.",
        "Parce qu’elles contiennent de la chlorophylle.",
        "Un organe comme le cœur, le poumon.",
        "La photosynthèse transforme la lumière en énergie.",
        "Le bois.",
        "Énergie électrique.",
        "Parce que sa densité est plus faible que celle de l’eau.",
        "Le métal.",
        "Le lait, la viande.",
        "Pour rester hydraté et faire fonctionner le corps.",
        "La vue, l’ouïe, le goût, l’odorat ou le toucher.",
        "Le cadre osseux qui soutient le corps.",
        "La feuille ou la racine.",
        "Une montagne qui peut cracher de la lave.",
        "Un reste d’un être vivant conservé dans la roche.",
        "L’eau.",
        "Vrai.",
        "L’oxygène.",
        "Pour produire de l’énergie et grandir."
      ]
    },
    {
      intro: 'Cycle renouvelé 5e SVT : nouvelle quinzaine, nouveaux repères scientifiques.',
      exercises: [
        "Nomme un insecte.",
        "Quel est l’état de l’eau à 25°C ?",
        "Donne une force qui maintient les planètes en orbite.",
        "Quelle source d’énergie vient du soleil ?",
        "Donne un exemple d’animal invertébré.",
        "Donne un exemple de plante à fleurs.",
        "Quel organe sert à entendre ?",
        "Quel gaz le corps humain expire-t-il ?",
        "Vrai ou faux : l’air est un mélange de gaz.",
        "Pourquoi les saisons changent-elles ?",
        "Qu’est-ce qu’un écosystème ?",
        "Quelle est la fonction d’une tige chez une plante ?",
        "Donne un exemple de molécule simple.",
        "À quoi sert le squelette ?",
        "Pourquoi les feuilles tombent-elles en automne ?",
        "Quel matériau est utilisé pour fabriquer une table ?",
        "Quelle énergie transforme une lampe en lumière ?",
        "Pourquoi un objet coule-t-il dans l’eau ?",
        "Donne un matériau conducteur de l’électricité.",
        "Donne un fruit riche en vitamines.",
        "Pourquoi respirons-nous ?",
        "Quel sens permet de sentir une fleur ?",
        "Qu’est-ce que la peau pour le corps ?",
        "Nomme la partie d’une plante qui se trouve dans le sol.",
        "Qu’est-ce qu’un paysage naturel ?",
        "Qu’est-ce qu’un fossile ?",
        "Pourquoi l’eau est-elle importante pour les plantes ?",
        "Vrai ou faux : le charbon est une roche.",
        "Donne un gaz présent dans l’air.",
        "Pourquoi le soleil est-il important pour les êtres vivants ?"
      ],
      solutions: [
        "Une abeille.",
        "Liquide.",
        "La gravité.",
        "L’énergie solaire.",
        "Une abeille.",
        "Une tulipe.",
        "L’oreille.",
        "Le dioxyde de carbone.",
        "Vrai.",
        "Parce que la Terre tourne autour du soleil.",
        "Un lieu où vivent des êtres vivants en interaction.",
        "Soutenir les feuilles et transporter l’eau.",
        "L’eau.",
        "Soutenir et protéger le corps.",
        "Parce qu’elles se préparent à l’hiver.",
        "Le bois.",
        "Énergie électrique.",
        "Parce que sa densité est plus grande que celle de l’eau.",
        "Le cuivre.",
        "Une orange.",
        "Pour apporter de l’oxygène au corps.",
        "L’odorat.",
        "Une protection et une barrière.",
        "La racine.",
        "Un ensemble de collines, de forêts et de rivières.",
        "Un reste d’un être vivant conservé dans la roche.",
        "Parce qu’elle transporte l’eau et les nutriments.",
        "Vrai.",
        "L’azote.",
        "Parce qu’il fournit de la chaleur et de la lumière."
      ]
    }
  ],
  '5e-technologie': [
    {
      intro: 'Série longue de 30 exercices de 5e en technologie, objets techniques et circuits.',
      exercises: [
        "Donne un exemple d’objet technique du quotidien.",
        "Qu’est-ce qu’un objet technique ?",
        "Quelle est la différence entre un outil et un objet technique ?",
        "Donne un exemple de matériau naturel.",
        "Donne un exemple de matériau artificiel.",
        "Qu’est-ce qu’un mécanisme ?",
        "Donne un exemple de levier.",
        "Qu’est-ce qu’un circuit électrique simple ?",
        "Quel est le rôle d’un interrupteur ?",
        "Quelle énergie utilise une lampe électrique ?",
        "Qu’est-ce qu’un prototype ?",
        "Qu’est-ce qu’une maquette ?",
        "Donne un exemple d’outil de mesure.",
        "Qu’est-ce qu’un capteur ?",
        "Pourquoi utilise-t-on le plastique dans certains objets ?",
        "Qu’est-ce qu’une pièce technique ?",
        "Qu’est-ce qu’un moteur ?",
        "Donne un exemple d’objet mobile.",
        "Donne un exemple d’objet fixe.",
        "Qu’est-ce que la maintenance ?",
        "Donne un exemple d’objet électronique.",
        "Donne un exemple d’objet mécanique.",
        "Pourquoi vérifier un dessin technique ?",
        "Qu’est-ce qu’un schéma ?",
        "Donne un exemple d’énergie utilisée par un robot.",
        "Qu’est-ce qu’un assemblage ?",
        "Donne un exemple de système d’alimentation.",
        "Qu’est-ce qu’un matériau isolant ?",
        "Donne un exemple d’énergie renouvelable.",
        "Pourquoi est-il important de recycler les matériaux ?"
      ],
      solutions: [
        "Un téléphone, une calculatrice, un vélo.",
        "Un objet créé pour répondre à un besoin technique.",
        "Un outil sert à travailler, un objet technique a un fonctionnement précis.",
        "Le bois.",
        "Le plastique.",
        "Un ensemble de pièces qui transmettent un mouvement.",
        "Une pince, une pelle.",
        "Un circuit où le courant peut circuler.",
        "Ouvrir ou fermer le passage du courant.",
        "L’énergie électrique.",
        "Un modèle d’essai d’un objet.",
        "Un petit modèle pour représenter un objet.",
        "Une règle, un mètre.",
        "Un élément qui mesure une grandeur comme la lumière.",
        "Parce qu’il est léger et facile à mouler.",
        "Une partie d’un objet qui a une fonction spécifique.",
        "Un dispositif qui transforme l’énergie en mouvement.",
        "Une voiture.",
        "Une porte.",
        "Entretenir un objet pour qu’il fonctionne bien.",
        "Un ordinateur.",
        "Un engrenage.",
        "Pour vérifier que le montage est correct.",
        "Un dessin qui montre les pièces et leurs connexions.",
        "L’électricité.",
        "Un ensemble de pièces assemblées pour fonctionner.",
        "Une batterie.",
        "Le bois, la laine.",
        "Le soleil, le vent.",
        "Pour réutiliser des matériaux et protéger l’environnement."
      ]
    }
  ],
  '5e-anglais': [
    {
      intro: 'Série longue de 30 exercices d’anglais 5e sur le présent simple, les questions et le vocabulaire.',
      exercises: [
        "Traduisez : « Je mange une pomme. »",
        "Choisis le bon pronom : « ___ is my friend. »",
        "Complète : « She (go/goes) to school. »",
        "Traduisez : « Où habites-tu ? »",
        "Écris : « J’aime le sport. »",
        "Choisis : « They (have/has) a dog. »",
        "Écris la négation : « He likes fish. »",
        "Traduis : « Nous sommes à l’école. »",
        "Complète : « I ___ (be) happy. »",
        "Traduisez : « Mon frère est grand. »",
        "Choisis le mot : « I am ___ teacher. » (a/an)",
        "Complète : « She ___ (have) a cat. »",
        "Traduisez : « Tu as un chat ? »",
        "Écris : « Je ne veux pas de bonbon. »",
        "Complète : « We ___ (play) football. »",
        "Traduisez : « Il est midi. »",
        "Complète : « You ___ (be) late. »",
        "Choisis : « He (doesn’t/don’t) like cats. »",
        "Traduis : « Elle est malade. »",
        "Quelle est la couleur du mot « blue » ?",
        "Écris : « Mon ami est gentil. »",
        "Complète : « I ___ (read) a book. »",
        "Traduis : « Le chien court. »",
        "Choisis : « We (is/are) ready. »",
        "Écris : « Je suis fatigué. »",
        "Traduis : « Les enfants jouent. »",
        "Choisis : « She can/could swim. »",
        "Complète : « I ___ (like) music. »",
        "Traduis : « Le chat dort. »",
        "Écris : « J’ai deux stylos. »"
      ],
      solutions: [
        "I eat an apple.",
        "He.",
        "She goes to school.",
        "Where do you live?",
        "I like sports.",
        "They have a dog.",
        "He does not like fish.",
        "We are at school.",
        "I am happy.",
        "My brother is tall.",
        "a.",
        "She has a cat.",
        "Do you have a cat?",
        "I do not want candy.",
        "We play football.",
        "It is noon.",
        "You are late.",
        "He doesn’t like cats.",
        "She is sick.",
        "Bleu.",
        "My friend is kind.",
        "I read a book.",
        "The dog runs.",
        "We are ready.",
        "I am tired.",
        "The children are playing.",
        "She can swim.",
        "I like music.",
        "The cat sleeps.",
        "I have two pens."
      ]
    }
  ],
  '5e-histoire-geographie': [
    {
      intro: 'Série longue de 30 exercices 5e en histoire et géographie sur le Moyen Âge et les repères.',
      exercises: [
        "Quel siècle correspond à l’an 500 ?",
        "Qu’est-ce qu’un château fort ?",
        "Quelle région traverse le Nil ?",
        "Quel est le nom de la période du Moyen Âge ?",
        "Citation : qui était le roi du royaume ?",
        "Nomme un pays d’Europe.",
        "Quelle est la capitale de la France ?",
        "Que signifie « féodal » ?",
        "Quel est le rôle d’un seigneur ?",
        "Qu’est-ce qu’un paysan ?",
        "Donne un exemple de transport utilisé au Moyen Âge.",
        "Qu’est-ce qu’un rempart ?",
        "Quel est l’objet principal d’un moulin à vent ?",
        "Que représente une église au Moyen Âge ?",
        "Qu’est-ce que l’écriture gothique ?",
        "Nomme un climat en France.",
        "Quel est le plus grand continent ?",
        "Quelle mer borde la France au sud ?",
        "Quel est le nom d’une île en Europe ?",
        "Qu’est-ce qu’une carte ?",
        "Donne un repère : l’équateur traverse quel continent ?",
        "Donne un exemple de ressource naturelle.",
        "Qu’est-ce qu’une frontière ?",
        "Quelle est la fonction d’une boussole ?",
        "Que mesure un planisphère ?",
        "Donne le sens du mot « voyage ». ",
        "Quel élément est nécessaire pour naviguer ?",
        "Pourquoi les châteaux forts étaient-ils construits en hauteur ?",
        "Qu’est-ce qu’un manuscrit ?",
        "Nomme un instrument de musique médiéval."
      ],
      solutions: [
        "Le VIᵉ siècle.",
        "Une grande forteresse médiévale.",
        "L’Afrique.",
        "Le Moyen Âge.",
        "Le roi dirigeait le royaume.",
        "La France.",
        "Paris.",
        "Qui appartient au seigneur.",
        "Gouverner et protéger ses terres.",
        "Une personne qui cultive la terre.",
        "Le cheval.",
        "Une grande muraille autour d’un château.",
        "Moudre le grain.",
        "Un lieu de prière et un symbole religieux.",
        "Un style d’écriture ancienne.",
        "Le climat méditerranéen.",
        "L’Asie.",
        "La mer Méditerranée.",
        "La Grande-Bretagne.",
        "Un dessin représentant des territoires.",
        "L’Afrique.",
        "L’eau.",
        "Une limite entre deux pays.",
        "Montrer la direction.",
        "La surface de la Terre.",
        "Un déplacement vers un autre lieu.",
        "Une carte et une boussole.",
        "Pour mieux voir et se protéger.",
        "Un livre écrit à la main.",
        "La harpe."
      ]
    }
  ],
  '4e-maths': [
    {
      intro: 'Série longue de 30 exercices de 4e en équations, proportions, pourcentages et géométrie.',
      exercises: [
        "Calcule : 5 × 9.",
        "Résous : 3x = 21.",
        "Calcule 20 % de 150.",
        "Si 4 kg coûtent 36 €, combien coûte 1 kg ?",
        "Divise : 45 ÷ 9.",
        "Écris 0,8 sous forme de fraction.",
        "Résous : x + 6 = 14.",
        "Calcule le périmètre d’un rectangle de 7 cm sur 10 cm.",
        "Calcule l’aire d’un rectangle de 12 cm sur 5 cm.",
        "Calcule : 3/4 + 1/2.",
        "Résous : 2x + 5 = 17.",
        "Convertis 250 cm en mètres.",
        "Calcule : 18 - 7.",
        "Si 5 stylos coûtent 15 €, combien coûtent 2 stylos ?",
        "Quel est le supplément d’un angle de 45° ?",
        "Calcule : 6².",
        "Convertis 0,25 en pourcentage.",
        "Donne le coefficient de proportionnalité si 6 kg coûtent 30 €.",
        "Résous : 7x = 56.",
        "Calcule l’aire d’un triangle de base 8 cm et de hauteur 5 cm.",
        "Écris 1 250 en notation décimale.",
        "Calcule : 0,6 + 1,4.",
        "Calcule : 2/3 - 1/3.",
        "Résous : x / 5 = 4.",
        "Quel est le périmètre d’un carré de côté 9 cm ?",
        "Si 3/5 d’un nombre est 18, quel est le nombre ?",
        "Calcule : 240 ÷ 12.",
        "Calcule 75 % de 80.",
        "Résous : x + 17 = 25.",
        "Quel est le triple de 8 ?"
      ],
      solutions: [
        "45.",
        "x = 7.",
        "30.",
        "9 €.",
        "5.",
        "4/5.",
        "x = 8.",
        "34 cm.",
        "60 cm².",
        "5/4.",
        "x = 6.",
        "2,5 m.",
        "11.",
        "6 €.",
        "135°.",
        "36.",
        "25 %.",
        "5 € par kg.",
        "x = 8.",
        "20 cm².",
        "1 250.",
        "2,0.",
        "1/3.",
        "x = 20.",
        "36 cm.",
        "30.",
        "20.",
        "8.",
        "24.",
        "24."
      ]
    }
  ],
  '4e-francais': [
    {
      intro: 'Série longue de 30 exercices de français 4e : conjugaison, accords et rédaction.',
      exercises: [
        "Conjugue : « Il (aller) au cinéma. » au présent.",
        "Accorde : « les filles sont (content) ».",
        "Quel est le sujet de : « La musique plaît aux élèves. » ?",
        "Remplace par un pronom : « Marie lit un livre. »",
        "Transforme en question : « Tu chantes. »",
        "Complète : « Je ___ (être) bien. »",
        "Écris au passé composé : « Il mange. »",
        "Choisis : « a / à » : « Il va __ l’école. »",
        "Accorde : « deux maisons (bleu) ».",
        "Réécris au pluriel : « un beau jardin ».",
        "Trouve le complément du nom dans : « la robe rouge ».",
        "Donne un synonyme de « petit ». ",
        "Quelle est la nature du mot « demain » ?",
        "Transforme en négation : « Nous aimons lire. »",
        "Écris une phrase exclamative avec « quel ». ",
        "Accorde : « ses amis sont (heureux) ».",
        "Écris au futur : « Je finis mes devoirs. »",
        "Choisis : « c’est / ses » : « ___ livre est bleu. »",
        "Donne l’adverbe dans : « Il parle lentement. »",
        "Écris : « Elle a gagné. » au passé composé.",
        "Quelle est la fonction du verbe dans une phrase ?",
        "Donne un exemple de phrase simple.",
        "Quel est le temps de « je courais » ?",
        "Accorde : « une voisine (charmant) ».",
        "Transforme : « Il lit un livre. » en la voix passive.",
        "Donne un antonyme de « grand ».",
        "Qu’est-ce qu’un adjectif qualificatif ?",
        "Nomme un pronom personnel.",
        "Donne le pluriel de « un cheval ».",
        "Quelle ponctuation termine une phrase exclamative ?"
      ],
      solutions: [
        "Il va au cinéma.",
        "Les filles sont contentes.",
        "La musique.",
        "Elle lit un livre.",
        "Chantes-tu ?",
        "Je suis bien.",
        "Il a mangé.",
        "à.",
        "deux maisons bleues.",
        "de beaux jardins.",
        "rouge.",
        "petit -> minuscule.",
        "un adverbe de temps.",
        "Nous n’aimons pas lire.",
        "Quel beau paysage !",
        "heureux.",
        "Je finirai mes devoirs.",
        "C’est livre est bleu. -> Ce n’est pas correct. Il faut « Ce livre est bleu. »",
        "lentement.",
        "Elle a gagné.",
        "Indiquer l’action ou l’état.",
        "Je lis une histoire.",
        "Imparfait.",
        "une charmante voisine.",
        "Un livre est lu par lui.",
        "petit.",
        "Un mot qui qualifie un nom.",
        "il.",
        "des chevaux.",
        "!"
      ]
    }
  ],
  '4e-anglais': [
    {
      intro: 'Série longue de 30 exercices d’anglais 4e : temps, questions et vocabulaire.',
      exercises: [
        "Traduis : « Il joue au foot. »",
        "Écris : « Nous avons un chat. »",
        "Choisis : « She (go/goes) to school. »",
        "Pose la question : « Tu aimes ton professeur ? »",
        "Écris au négatif : « I like apples. »",
        "Choisis : « Do you (like/likes) music? »",
        "Traduis : « Mon frère est grand. »",
        "Complète : « I ___ (be) ready. »",
        "Écris : « Elle ne parle pas. »",
        "Traduis : « J’ai trois stylos. »",
        "Complète : « He ___ (have) a red bike. »",
        "Pose la question : « Vous êtes en classe ? »",
        "Écris : « Nous allons à l’école. »",
        "Choisis : « a / an » : « I have ___ apple. »",
        "Traduis : « La maison est grande. »",
        "Complète : « They ___ (play) in the garden. »",
        "Écris : « Je fais mes devoirs. » en anglais.",
        "Choisis : « He (doesn’t/don’t) like pizza. »",
        "Traduis : « Elle est heureuse. »",
        "Que veut dire « school » ?",
        "Écris : « J’ai un petit frère. »",
        "Complète : « You ___ (need) a pencil. »",
        "Traduis : « Le chat est noir. »",
        "Écris : « Il mange une pomme. »",
        "Choisis : « We (is/are) happy. »",
        "Pose la question : « Où vas-tu ? »",
        "Traduis : « Mon livre est rouge. »",
        "Écris le mot « bleu » en anglais.",
        "Complète : « She ___ (watch) TV. »"
      ],
      solutions: [
        "He plays football.",
        "We have a cat.",
        "She goes to school.",
        "Do you like your teacher?",
        "I do not like apples.",
        "Do you like music?",
        "My brother is tall.",
        "I am ready.",
        "She does not speak.",
        "I have three pens.",
        "He has a red bike.",
        "Are you in class?",
        "We go to school.",
        "an.",
        "The house is big.",
        "They play in the garden.",
        "I do my homework.",
        "He doesn’t like pizza.",
        "She is happy.",
        "école.",
        "I have a little brother.",
        "You need a pencil.",
        "The cat is black.",
        "He eats an apple.",
        "We are happy.",
        "Where do you go?",
        "My book is red.",
        "blue.",
        "She watches TV."
      ]
    }
  ],
  '4e-physique-chimie': [
    {
      intro: 'Série longue de 30 exercices de physique-chimie 4e sur la matière, l’énergie et l’électricité.',
      exercises: [
        "Quelle est la différence entre un solide et un liquide ?",
        "Donne un exemple d’énergie renouvelable.",
        "Que fait un interrupteur ?",
        "Qu’est-ce qu’un mélange homogène ?",
        "Qu’est-ce qu’un conducteur électrique ?",
        "Pourquoi l’eau bout-elle à 100°C ?",
        "Qu’est-ce qu’une réaction chimique ?",
        "Donne un exemple de matériau isolant.",
        "Qu’est-ce que la masse ?",
        "Donne un exemple de mélange hétérogène.",
        "Qu’est-ce qu’une molaire de matière ?",
        "Quelle est l’unité de la masse ?",
        "Qu’est-ce que la densité ?",
        "Qu’est-ce qu’une simple machine ?",
        "Donne un exemple de source d’énergie fossile.",
        "Qu’est-ce qu’un circuit fermé ?",
        "Que contient une pile ?",
        "Pourquoi la lumière chauffe-t-elle ?",
        "Qu’est-ce qu’un gaz ?",
        "Qu’est-ce qu’une solution ?",
        "Donne un exemple de changement d’état.",
        "Qu’est-ce qu’une force ?",
        "Donne un exemple de source d’énergie solaire.",
        "Qu’est-ce qu’un solide cristallin ?",
        "Que mesure un thermomètre ?",
        "Qu’est-ce que l’oxydation ?",
        "Pourquoi utilise-t-on le plastique comme isolant ?",
        "Donne un exemple d’objet électrique.",
        "Qu’est-ce qu’une masse volumique ?",
        "Pourquoi l’eau est-elle transparente ?"
      ],
      solutions: [
        "Le solide garde sa forme, le liquide prend la forme du récipient.",
        "Le soleil, le vent, l’eau.",
        "Ouvrir ou fermer le passage du courant.",
        "Un mélange uniforme comme l’eau sucrée.",
        "Un matériau qui laisse passer le courant comme le cuivre.",
        "Parce que la vapeur d’eau se forme à 100°C à pression normale.",
        "Une transformation de matière en produisant de nouvelles substances.",
        "Le plastique, le verre, le bois.",
        "La quantité de matière d’un objet.",
        "Un mélange comme une salade.",
        "La quantité de matière par mole.",
        "Le kilogramme.",
        "La masse par rapport au volume.",
        "Un dispositif simple comme un levier.",
        "Le charbon.",
        "Un circuit où le courant peut circuler en continu.",
        "Une source d’énergie et des produits chimiques.",
        "Parce que l’électricité produit de l’énergie lumineuse.",
        "Une substance sans forme propre.",
        "Un liquide contenant un soluté dissous.",
        "La glace qui fond.",
        "Une action qui modifie le mouvement ou la forme.",
        "Une cellule solaire.",
        "Un solide formé de cristaux comme le sel.",
        "La température.",
        "Une réaction avec l’oxygène.",
        "Parce qu’il ne laisse pas passer la chaleur et l’électricité.",
        "Une lampe.",
        "La masse divisée par le volume.",
        "Parce qu’elle ne contient pas de particules visibles qui bloquent la lumière."
      ]
    }
  ],
  '4e-histoire-geographie': [
    {
      intro: 'Série longue de 30 exercices 4e en histoire et géographie sur la Renaissance, les explorations et les repères.',
      exercises: [
        "Quelle période suit le Moyen Âge ?",
        "Nomme un explorateur célèbre.",
        "Que découvre Christophe Colomb en 1492 ?",
        "Qu’est-ce qu’un empire colonial ?",
        "Quelle est la capitale de la France ?",
        "Donne le nom d’un océan.",
        "Qu’est-ce qu’une carte ?",
        "Quelle est la capitale de l’Espagne ?",
        "Nomme un pays d’Afrique.",
        "Qu’est-ce qu’une frontière ?",
        "Donne un exemple de produit échangé au commerce triangulaire.",
        "Qu’est-ce qu’un atlas ?",
        "Quel est le plus grand continent ?",
        "Quelle langue parle-t-on au Brésil ?",
        "Qu’est-ce qu’une longitude ?",
        "Qu’est-ce qu’une latitude ?",
        "Pourquoi les explorateurs partaient-ils en mer ?",
        "Donne un exemple de découverte scientifique de la Renaissance.",
        "Qu’est-ce qu’un artisan ?",
        "Qu’est-ce qu’un mécène ?",
        "Nomme un monument italien de la Renaissance.",
        "Quelle est la capitale de l’Italie ?",
        "Qu’est-ce qu’une monarchie ?",
        "Nomme un pays d’Asie.",
        "Qu’est-ce qu’un continent ?",
        "Donne un repère : l’équateur traverse l’Amérique du Sud. Vrai ou faux ?",
        "Quelle est la principale ressource agricole d’une région ?",
        "Qu’est-ce qu’une carte routière ?",
        "Quel est le rôle des villes au XVe siècle ?",
        "Qu’est-ce qu’un pays développé ?"
      ],
      solutions: [
        "La Renaissance.",
        "Christophe Colomb.",
        "L’Amérique.",
        "Un pays qui possède des colonies étrangères.",
        "Paris.",
        "L’océan Atlantique.",
        "Un document qui représente le monde.",
        "Madrid.",
        "L’Égypte.",
        "Une ligne qui sépare deux pays.",
        "Le sucre.",
        "Un livre de cartes géographiques.",
        "L’Asie.",
        "Le portugais.",
        "Une mesure Est-Ouest.",
        "Une mesure Nord-Sud.",
        "Pour découvrir de nouvelles routes et richesses.",
        "L’héliocentrisme de Copernic.",
        "Une personne qui fait un travail manuel.",
        "Une personne qui finance un artiste.",
        "Le Duomo de Florence.",
        "Rome.",
        "Un régime dirigé par un roi.",
        "La Chine.",
        "Une grande zone de terre.",
        "Vrai.",
        "Le blé.",
        "Une carte qui montre les routes.",
        "Elles permettent le commerce et la culture.",
        "Un pays riche et bien développé."
      ]
    }
  ],
  '3e-maths': [
    {
      intro: 'Série longue de 30 exercices 3e en maths : fonctions, statistiques, équations, géométrie et pourcentages.',
      exercises: [
        "Calcule : 7 × 8.",
        "Détermine le périmètre d’un rectangle de 5 cm sur 8 cm.",
        "Écris la valeur de y si y = 2x + 3 et x = 4.",
        "Calcule 25 % de 240.",
        "Volume d’un cube de 3 cm d’arête.",
        "Quel est 10 % de 90 ?",
        "Quelle est la médiane de 3, 5, 8 ?",
        "Un angle est de 60°. Quel est son complémentaire ?",
        "Calcule l’aire d’un triangle de base 6 cm et de hauteur 4 cm.",
        "Résous : 3x - 5 = 16.",
        "Résous : 4x = 28.",
        "Calcule : 15 × 6.",
        "Calcule : 96 ÷ 12.",
        "Calcule 40 % de 150.",
        "Un segment mesure 12 cm et un autre 5 cm, quel est le total ?",
        "Quel est le périmètre d’un carré de côté 7 cm ?",
        "Écris 0,75 en fraction irréductible.",
        "Si un sac coûte 18 € et que tu as 54 €, combien de sacs peux-tu acheter ?",
        "Détermine l’aire d’un rectangle de 10 cm sur 4 cm.",
        "Calcule la moyenne de 12, 15 et 18.",
        "Quelle est la fréquence de 2 dans la série 2, 5, 2, 8 ?",
        "Résous : x/4 = 5.",
        "Calcule : 2² + 3².",
        "Détermine le volume d’un prisme de base 5 cm² et de hauteur 3 cm.",
        "Quel est le double de 13 ?",
        "Calcule : 9 × 9.",
        "Donne l’aire d’un cercle de rayon 3 cm (π reste symbolique).",
        "Quel est 1/4 de 60 ?",
        "Résous : x + 17 = 25.",
        "Quel est le triple de 8 ?"
      ],
      solutions: [
        "56.",
        "26 cm.",
        "11.",
        "60.",
        "27 cm³.",
        "9.",
        "5.",
        "30°.",
        "12 cm².",
        "x = 7.",
        "x = 7.",
        "90.",
        "8.",
        "60.",
        "17 cm.",
        "28 cm.",
        "3/4.",
        "3 sacs.",
        "40 cm².",
        "15.",
        "2.",
        "x = 20.",
        "13.",
        "15 cm³.",
        "26.",
        "81.",
        "9π cm².",
        "15.",
        "x = 8.",
        "24."
      ]
    }
  ],
  '3e-francais': [
    {
      intro: 'Série longue de 30 exercices de français 3e en écriture, grammaire et analyse de texte.',
      exercises: [
        "Identifie le sujet et le verbe : « Les élèves lisent un livre. »",
        "Transforme en phrase interrogative : « Tu as fini tes exercices. »",
        "Quel est le participe passé du verbe « voir » ?",
        "Accorde : « une fille (heureux) ».",
        "Écris au passé composé : « Il mange. »",
        "Trouve le champ lexical de la mer.",
        "Qu’est-ce qu’une métaphore ?",
        "Donne un exemple de phrase exclamative.",
        "Quel type de texte est un conte ?",
        "Accorde : « les maisons sont (bleu) ».",
        "Transforme en négation : « Il parle. »",
        "Donne un antonyme de « grand ».",
        "Quel est le complément du nom dans : « Le livre de la classe ».",
        "Écris : « Nous avons gagné. » au passé composé.",
        "Identifie le temps de : « il avait fini ». ",
        "Qu’est-ce qu’un pronom relatif ?",
        "Remplace « les enfants » par un pronom.",
        "Écris une phrase complexe avec « parce que ». ",
        "Donne un synonyme de « triste ».",
        "Qu’est-ce qu’une phrase affirmative ?",
        "Donne un exemple de pronom personnel.",
        "Accorde : « un animal (petit) ».",
        "Quelle est la fonction du verbe dans une phrase ?",
        "Transforme en voix passive : « Le chat mange la souris. »",
        "Quel est l’adverbe dans : « Il court rapidement. »",
        "Donne le féminin de « acteur ».",
        "Écris : « Je vois un oiseau. » au futur simple.",
        "Accorde : « les voitures sont (rouge) ».",
        "Qu’est-ce qu’une comparaison ?",
        "Nomme un mot invariable."
      ],
      solutions: [
        "Sujet : les élèves ; verbe : lisent.",
        "As-tu fini tes exercices ?",
        "vu.",
        "une fille heureuse.",
        "Il a mangé.",
        "plage, vague, bateau.",
        "Une comparaison sans « comme ».",
        "Quel beau ciel !",
        "Un récit merveilleux.",
        "bleues.",
        "Il ne parle pas.",
        "petit.",
        "de la classe.",
        "Nous avons gagné.",
        "Plus-que-parfait.",
        "Un mot qui relie deux groupes nominaux.",
        "ils.",
        "Je chante parce que j’aime la musique.",
        "malheureux.",
        "Une phrase qui affirme quelque chose.",
        "elle.",
        "un petit animal.",
        "Exprimer l’action.",
        "La souris est mangée par le chat.",
        "rapidement.",
        "actrice.",
        "Je verrai un oiseau.",
        "rouges.",
        "Une comparaison compare deux choses.",
        "toujours."
      ]
    }
  ],
  '3e-histoire-geographie': [
    {
      intro: 'Série longue de 30 exercices 3e en histoire-géographie sur le 20e siècle et les repères mondiaux.',
      exercises: [
        "Quel événement déclenche la Première Guerre mondiale ?",
        "Quelle date marque la fin de la Seconde Guerre mondiale ?",
        "Qu’est-ce qu’une guerre mondiale ?",
        "Cite deux pays d’Europe.",
        "Quelle est la capitale de l’Allemagne ?",
        "Qu’est-ce qu’une démocratie ?",
        "Donne un exemple de droit fondamental.",
        "Quelle est la capitale de la France ?",
        "Qu’est-ce qu’une frontière ?",
        "Qu’est-ce qu’un himalayen ?",
        "Quelle est la capitale de l’Italie ?",
        "Donne un continent traversé par l’équateur.",
        "Qu’est-ce qu’un territoire ?",
        "Donne un exemple de ressources naturelles.",
        "Qu’est-ce qu’une carte politique ?",
        "Qu’est-ce qu’un pays industrialisé ?",
        "Donne un exemple de pays en développement.",
        "Quelle est la fonction d’une capitale ?",
        "Qu’est-ce que la géopolitique ?",
        "Donne un exemple de grand fleuve européen.",
        "Qu’est-ce qu’une population active ?",
        "Quel est le rôle d’un président ?",
        "Qu’est-ce que la liberté de la presse ?",
        "Qu’est-ce qu’un traité de paix ?",
        "Quelle est la capitale du Royaume-Uni ?",
        "Que mesure une échelle sur une carte ?",
        "Qu’est-ce que l’ONU ?",
        "Donne un exemple d’île française.",
        "Qu’est-ce qu’une unité de la monnaie européenne ?",
        "Quelle est la mer à l’est de la France ?"
      ],
      solutions: [
        "L’assassinat de l’archiduc François-Ferdinand.",
        "1945.",
        "Une guerre qui concerne plusieurs continents.",
        "France et Italie.",
        "Berlin.",
        "Un régime où le pouvoir appartient au peuple.",
        "Liberté d’expression.",
        "Paris.",
        "Une ligne séparant deux pays.",
        "Quelqu’un qui habite l’Himalaya.",
        "Rome.",
        "L’Afrique.",
        "Une zone de terre occupée par un État.",
        "Le pétrole.",
        "Une carte montrant les pays.",
        "Un pays riche en industrie.",
        "Un pays en Afrique qui se développe.",
        "La ville principale du pays.",
        "L’étude des relations entre les États.",
        "Le Danube.",
        "Les personnes qui travaillent.",
        "Diriger le pays et le représenter.",
        "Le droit d’informer librement.",
        "Un accord pour mettre fin à la guerre.",
        "Londres.",
        "La distance entre deux points sur la carte.",
        "Organisation des Nations unies.",
        "La Corse.",
        "L’euro.",
        "La mer Méditerranée."
      ]
    }
  ],
  '3e-anglais': [
    {
      intro: 'Série longue de 30 exercices d’anglais 3e sur le past simple, le futur, les modaux et les questions.',
      exercises: [
        "Traduisez : « Hier, j’ai joué au foot. »",
        "Écris : « Nous avons vu un film. »",
        "Choisis : « He (went/goes) to school yesterday. »",
        "Écris au futur : « Je finirai mes devoirs demain. »",
        "Choisis : « She (will/would) come tomorrow. »",
        "Traduis : « Il va pleuvoir. »",
        "Complète : « You ___ (must/mustn’t) do your homework. »",
        "Traduis : « Puis-je entrer ? »",
        "Choisis : « I can/could swim. »",
        "Écris : « J’ai deux stylos. » en anglais.",
        "Écris : « Je vais à l’école. » au futur.",
        "Traduis : « Elle est allée en ville. »",
        "Pose la question : « Tu as fini ? »",
        "Choisis : « He (doesn’t/don’t) like pizza. »",
        "Traduis : « Nous irons au parc. »",
        "Complète : « They ___ (were/was) at the museum. »",
        "Écris : « Il ne peut pas venir. »",
        "Traduis : « Je suis fatigué. »",
        "Quelle est la couleur du mot « green » ?",
        "Écris : « Elle parle très bien anglais. »",
        "Choisis : « I ___ (have/has) a blue pencil. »",
        "Écris : « Le chien a couru. » au past simple.",
        "Pose la question : « Où est la bibliothèque ? »",
        "Traduis : « Je dois étudier. »",
        "Complète : « They ___ (will/would) travel next summer. »",
        "Écris : « Il a écrit une lettre. » au past simple.",
        "Traduis : « Mon sac est lourd. »",
        "Choisis : « We (are/is) ready. »",
        "Écris : « J’aime la musique. »",
        "Traduis : « La voiture est rouge. »"
      ],
      solutions: [
        "Yesterday, I played football.",
        "We saw a film.",
        "went.",
        "I will finish my homework tomorrow.",
        "will.",
        "It is going to rain.",
        "must.",
        "May I come in?",
        "can.",
        "I have two pens.",
        "I will go to school.",
        "She went to town.",
        "Have you finished?",
        "doesn’t.",
        "We will go to the park.",
        "were.",
        "He cannot come.",
        "I am tired.",
        "green.",
        "She speaks English very well.",
        "have.",
        "The dog ran.",
        "Where is the library?",
        "I must study.",
        "will.",
        "He wrote a letter.",
        "My bag is heavy.",
        "are.",
        "I like music.",
        "The car is red."
      ]
    }
  ],
  '3e-physique-chimie': [
    {
      intro: 'Série longue de 30 exercices de physique-chimie 3e sur forces, énergie, réactions et circuits.',
      exercises: [
        "Quel est l’effet d’une force sur un objet ?",
        "Un circuit est-il ouvert ou fermé si l’ampoule s’allume ?",
        "Quelle est l’unité de la masse ?",
        "Donne un exemple de réaction chimique.",
        "Qu’est-ce qu’un mélange homogène ?",
        "Que devient l’eau quand elle chauffe ?",
        "Qu’est-ce qu’une force ?",
        "Donne un exemple d’énergie renouvelable.",
        "Qu’est-ce qu’une masse volumique ?",
        "Qu’est-ce qu’un conducteur électrique ?",
        "Vrai ou faux : le fer est un bon conducteur.",
        "Qu’est-ce qu’une énergie cinétique ?",
        "Quelle est l’unité de la température ?",
        "Qu’est-ce que l’oxydation ?",
        "Pourquoi l’énergie solaire est-elle renouvelable ?",
        "Qu’est-ce qu’un corps rocheux ?",
        "Donne un exemple de solide cristallin.",
        "Qu’est-ce qu’un gaz parfait ?",
        "Qu’est-ce que la pression atmosphérique ?",
        "Donne un exemple d’isolation thermique.",
        "Qu’est-ce qu’un prisme ?",
        "Quelle est la formule de la densité ?",
        "Pourquoi l’eau est-elle un bon solvant ?",
        "Qu’est-ce qu’une pile électrique ?",
        "Donne un exemple de circuit en série.",
        "Qu’est-ce qu’une énergie potentielle ?",
        "Pourquoi le bois est-il un isolant ?",
        "Qu’est-ce qu’une réaction endothermique ?",
        "Qu’est-ce qu’un aimant ?",
        "Donne un exemple de transformation de l’énergie chimique en énergie thermique."
      ],
      solutions: [
        "Elle peut déplacer ou déformer l’objet.",
        "Fermé.",
        "Le kilogramme.",
        "La combustion.",
        "Un mélange uniforme comme l’eau salée.",
        "Elle devient vapeur.",
        "Une action qui change le mouvement ou la forme.",
        "Le soleil.",
        "La masse divisée par le volume.",
        "Un matériau qui laisse passer le courant.",
        "Vrai.",
        "L’énergie du mouvement.",
        "Le degré Celsius.",
        "Une réaction avec l’oxygène.",
        "Parce qu’elle est produite sans se tarir.",
        "Une roche naturelle.",
        "Le sel.",
        "Un gaz qui suit les lois de la physique idéale.",
        "La force exercée par l’air sur les objets.",
        "La laine.",
        "Un solide à faces triangulaires.",
        "masse ÷ volume.",
        "Parce qu’elle dissout de nombreuses substances.",
        "Un générateur qui fournit un courant.",
        "Une lampe et une batterie en série.",
        "L’énergie d’un objet en hauteur.",
        "Parce qu’il ne conduit pas bien la chaleur.",
        "Une réaction qui absorbe de la chaleur.",
        "Un objet qui attire le fer.",
        "La combustion d’un combustible."
      ]
    }
  ]
};

function formatDate(date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getCurrentPeriodIndex(length) {
  if (!length) {
    return 0;
  }
  const today = new Date();
  const epochDays = Math.floor(today.getTime() / 86400000);
  return Math.floor(epochDays / rotationPeriodDays) % length;
}

function getCurrentPeriodStartDate() {
  const today = new Date();
  const epochDays = Math.floor(today.getTime() / 86400000);
  const startDay = Math.floor(epochDays / rotationPeriodDays) * rotationPeriodDays;
  return new Date(startDay * 86400000);
}

function transformAlternateText(text) {
  const replacements = [
    [/\bParis\b/g, 'Lyon'],
    [/\bFrance\b/g, 'Allemagne'],
    [/\bItalie\b/g, 'Espagne'],
    [/\bBrésil\b/g, 'Portugal'],
    [/\bmon frère\b/g, 'ma sœur'],
    [/\bMon frère\b/g, 'Ma sœur'],
    [/\bmy brother\b/g, 'my sister'],
    [/\ba cat\b/g, 'a dog'],
    [/\bcat\b/g, 'dog'],
    [/\bchat\b/g, 'chien'],
    [/\bchien\b/g, 'chat'],
    [/\ble ciel\b/g, 'le jardin'],
    [/\bécole\b/g, 'bibliothèque'],
    [/\bmaison\b/g, 'école'],
    [/\bbleu\b/g, 'jaune'],
    [/\brouge\b/g, 'vert'],
    [/\bgrand\b/g, 'haut'],
    [/\bpetit\b/g, 'court'],
    [/\bI like\b/g, 'I love'],
    [/\bapple\b/g, 'banana'],
    [/\bblue\b/g, 'green'],
    [/\bMy brother\b/g, 'My sister'],
    [/\bFrance\b/g, 'Allemagne'],
    [/\bParis\b/g, 'Lyon']
  ];

  let result = text;
  replacements.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });
  return result;
}

function buildAlternateCycle(baseCycle) {
  const alternate = {
    intro: `${baseCycle.intro} (nouvelle quinzaine)`,
    exercises: baseCycle.exercises.map(transformAlternateText),
    solutions: baseCycle.solutions.map(transformAlternateText)
  };
  alternate.variantGenerated = true;
  return alternate;
}

function renderPageExercises() {
  const section = document.getElementById('exercise-section');
  if (!section) {
    return;
  }

  const grade = section.dataset.grade;
  const subject = section.dataset.subject;
  if (!grade || !subject) {
    return;
  }

  const key = `${grade}-${subject}`;
  const cycles = pageData[key];
  if (cycles && cycles.length === 1 && !cycles[0].variantGenerated) {
    cycles.push(buildAlternateCycle(cycles[0]));
  }

  if (!cycles || !cycles.length) {
    return;
  }

  renderModeSelection(section, grade, subject);

  const index = getCurrentPeriodIndex(cycles.length);
  const period = cycles[index];

  const exerciseIntro = document.getElementById('exercise-intro');
  const exerciseList = document.getElementById('exercise-list');
  const solutionList = document.getElementById('solution-list');
  const refreshInfo = document.getElementById('refresh-info');
  const solutionsContainer = document.getElementById('solutions');
  const toggleButton = document.getElementById('toggle-solutions');

  if (exerciseIntro) {
    exerciseIntro.textContent = period.intro;
  }

  if (exerciseList) {
    exerciseList.innerHTML = period.exercises
      .map((exercise, index) => `
        <li class="exercise-item">
          <div class="exercise-question"><strong>Exercice ${index + 1} :</strong> ${exercise}</div>
          <p class="exercise-note">Choisis sur l'appareil ou dans le cahier puis clique sur Terminé quand tu as fini.</p>
          <button type="button" class="exercise-done-btn" data-exercise-index="${index}">Terminé</button>
        </li>`)
      .join('');
    attachExerciseButtons(grade, subject);
  }

  if (solutionList) {
    solutionList.innerHTML = period.solutions.map(solution => `<li>${solution}</li>`).join('');
  }

  if (refreshInfo) {
    refreshInfo.textContent = `Exercices renouvelés tous les ${rotationPeriodDays} jours. Série ${index + 1}/${cycles.length} — mise à jour le ${formatDate(getCurrentPeriodStartDate())}.`;
  }

  if (solutionsContainer && !solutionsContainer.classList.contains('hidden')) {
    solutionsContainer.classList.add('hidden');
  }

  if (toggleButton) {
    toggleButton.textContent = 'Voir les réponses';
  }
}

const toggleButton = document.getElementById('toggle-solutions');
const solutionsContainer = document.getElementById('solutions');

if (toggleButton && solutionsContainer) {
  toggleButton.addEventListener('click', () => {
    const isHidden = solutionsContainer.classList.contains('hidden');
    solutionsContainer.classList.toggle('hidden');
    toggleButton.textContent = isHidden ? 'Masquer les réponses' : 'Voir les réponses';
    if (isHidden) {
      showToast('Les réponses sont maintenant visibles.');
    }
  });
}

renderPageExercises();
