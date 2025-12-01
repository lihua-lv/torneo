let rounds = [];
let originalPlayers = [];
let teams = [];

/* -----------------------------
   GENERAR / REGENERAR TORNEO
------------------------------*/
function regenerateTournament() {
    if (!originalPlayers.length) return;
    generateTournament(originalPlayers.join("\n"));
}

function generateTournament(forcedNames = null) {
    let text = forcedNames || document.getElementById("namesInput").value.trim();
    if (!text) return alert("Escribe al menos 2 jugadores");

    let players = text.split("\n").map(n => n.trim()).filter(n => n !== "");
    if (players.length < 2) return alert("Necesitas al menos 2 jugadores");

    originalPlayers = players.slice();
    players = shuffle(players);

    // Crear equipos 2 vs 2
    teams = [];
    for (let i = 0; i < players.length; i += 2) {
        let team = players.slice(i, i + 2);
        if (team.length === 1) team.push("(BYE)");
        teams.push(team);
    }

    rounds = createBracket(teams);
    renderBracket();
}

/* -----------------------------
   SHUFFLE
------------------------------*/
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/* -----------------------------
   POTENCIA DE 2
------------------------------*/
function nextPowerOfTwo(x) {
    let p = 1;
    while (p < x) p *= 2;
    return p;
}

/* -----------------------------
   CREAR BRACKET CON REPESCA
------------------------------*/
function createBracket(teams) {
    let bracket = [];
    let firstRound = teams.map(team => ({ team, winner: null }));

    // Revisar si necesitamos partidos extra para completar potencia de 2
    const nextPow2 = nextPowerOfTwo(firstRound.length);
    const extraNeeded = nextPow2 - firstRound.length;

    if (extraNeeded > 0) {
        shuffle(firstRound);
        let extraMatches = [];
        for (let i = 0; i < extraNeeded; i++) {
            let t = firstRound.pop();
            extraMatches.push({ team: t.team, winner: null });
        }
        firstRound = firstRound.concat(extraMatches);
    }

    bracket.push(firstRound);

    // Crear rondas sucesivas
    let current = firstRound;
    while (current.length > 1) {
        let next = [];
        for (let i = 0; i < current.length; i += 2) {
            next.push({ team: null, winner: null });
        }
        bracket.push(next);
        current = next;
    }

    return bracket;
}

/* -----------------------------
   SELECCIONAR GANADOR
------------------------------*/
function pickWinner(roundIndex, matchIndex) {
    let match = rounds[roundIndex][matchIndex];
    if (!match.team) return;
    match.winner = match.team;

    if (roundIndex + 1 < rounds.length) {
        let nextMatch = Math.floor(matchIndex / 2);
        rounds[roundIndex + 1][nextMatch].team = match.team;
    }

    renderBracket();
}

/* -----------------------------
   RENDER BRACKET
------------------------------*/
function renderBracket() {
    const bracketDiv = document.getElementById("bracket");
    bracketDiv.innerHTML = "";

    let colWidth = 220;
    let startX = 50;

    rounds.forEach((round, roundIndex) => {
        let roundDiv = document.createElement("div");
        roundDiv.classList.add("round");
        roundDiv.style.left = `${startX + roundIndex * colWidth}px`;

        // Título de la ronda
        let title = document.createElement("h3");
        title.textContent = getRoundName(roundIndex, rounds.length);
        roundDiv.appendChild(title);

        // Cada partido
        round.forEach((match, matchIndex) => {
            let matchDiv = document.createElement("div");
            matchDiv.classList.add("match");
            matchDiv.dataset.round = roundIndex;
            matchDiv.dataset.match = matchIndex;

            if (match.team) {
                matchDiv.innerHTML = match.team.join("<br>&<br>");
                if (match.team[0] !== "(BYE)") matchDiv.onclick = () => pickWinner(roundIndex, matchIndex);
            } else {
                matchDiv.textContent = "Esperando...";
            }

            // Colores alternados
            const colorClass = `team-color-${Math.floor(matchIndex / 2) % 4}`;
            matchDiv.classList.add(colorClass);

            // Emoji ganador
            if (match.winner) {
                matchDiv.innerHTML = match.team.join("<br>&<br>") + " 🏆";
            }

            // Final dorada
            if (roundIndex === rounds.length - 1 && match.winner) {
                matchDiv.style.backgroundColor = "gold";
            }

            roundDiv.appendChild(matchDiv);
        });

        bracketDiv.appendChild(roundDiv);
    });
}

/* -----------------------------
   NOMBRE DE LA RONDA
------------------------------*/
function getRoundName(i, total) {
    if (i === total - 1) return "Ganador";
    if (i === total - 2) return "Final";
    if (i === total - 3) return "Semis";
    return `Ronda ${i + 1}`;
}

/* -----------------------------
   EXPORTAR IMAGEN
------------------------------*/
function exportAsImage() {
    const bracketContainer = document.getElementById("bracketContainer");
    html2canvas(bracketContainer, { backgroundColor: "#fff" }).then(canvas => {
        const a = document.createElement("a");
        a.href = canvas.toDataURL();
        a.download = "bracket.png";
        a.click();
    });
}
