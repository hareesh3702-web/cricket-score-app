let teams = [];
let match = null;

const ROLES = ["Batter", "Bowler", "All-Rounder", "Keeper"];

function createTeamInputs() {
  const count = Number(document.getElementById("teamCount").value);
  const container = document.getElementById("teamInputs");

  if (count < 2 || count > 16) {
    alert("Please enter between 2 and 16 teams.");
    return;
  }

  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const box = document.createElement("div");
    box.className = "team-box";

    box.innerHTML = `
      <label>Team ${i + 1} Name</label>
      <input class="team-name" placeholder="Enter team name">

      <label>Number of Players</label>
      <input class="player-count" type="number" min="1" max="20" value="11">

      <div class="players"></div>

      <button onclick="addPlayerInputs(this)">Add Player</button>
    `;

    container.appendChild(box);
    addPlayerInputs(box.querySelector("button"));
  }
}

function addPlayerInputs(button) {
  const playersBox = button.parentElement.querySelector(".players");

  const row = document.createElement("div");
  row.className = "player-row";

  row.innerHTML = `
    <input class="player-name" placeholder="Player name">
    <select class="player-role">
      <option>Batter</option>
      <option>Bowler</option>
      <option>All-Rounder</option>
      <option>Keeper</option>
    </select>
  `;

  playersBox.appendChild(row);
}

function saveTeams() {
  const teamBoxes = document.querySelectorAll(".team-box");
  teams = [];

  teamBoxes.forEach(box => {
    const teamName = box.querySelector(".team-name").value.trim();
    const playerRows = box.querySelectorAll(".player-row");

    if (!teamName) {
      alert("Please enter every team name.");
      return;
    }

    const players = [];

    playerRows.forEach(row => {
      const playerName = row.querySelector(".player-name").value.trim();
      const playerRole = row.querySelector(".player-role").value;

      if (playerName) {
        players.push({
          name: playerName,
          role: playerRole,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          out: false,
          status: "Did Not Bat",
          bowlingBalls: 0,
          bowlingRuns: 0,
          wickets: 0
        });
      }
    });

    if (players.length === 0) {
      alert(`Please add at least one player for ${teamName}.`);
      return;
    }

    teams.push({
      name: teamName,
      players
    });
  });

  if (teams.length < 2) {
    alert("Please add at least two teams.");
    return;
  }

  localStorage.setItem("cricketTeams", JSON.stringify(teams));

  fillTeamSelects();
  document.getElementById("teams-section").classList.add("hidden");
  document.getElementById("match-setup-section").classList.remove("hidden");

  alert("Teams and players saved successfully.");
}

function fillTeamSelects() {
  const battingTeam = document.getElementById("battingTeam");
  const bowlingTeam = document.getElementById("bowlingTeam");

  battingTeam.innerHTML = "";
  bowlingTeam.innerHTML = "";

  teams.forEach(team => {
    const option1 = document.createElement("option");
    option1.value = team.name;
    option1.textContent = team.name;
    battingTeam.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = team.name;
    option2.textContent = team.name;
    bowlingTeam.appendChild(option2);
  });

  if (teams.length > 1) {
    bowlingTeam.selectedIndex = 1;
  }
}

function startMatch() {
  const battingTeamName = document.getElementById("battingTeam").value;
  const bowlingTeamName = document.getElementById("bowlingTeam").value;
  const totalOvers = Number(document.getElementById("totalOvers").value);

  if (battingTeamName === bowlingTeamName) {
    alert("Batting team and bowling team cannot be the same.");
    return;
  }

  const battingTeam = teams.find(team => team.name === battingTeamName);
  const bowlingTeam = teams.find(team => team.name === bowlingTeamName);

  if (!battingTeam || !bowlingTeam) {
    alert("Please save teams first.");
    return;
  }

  match = {
    totalOvers,
    innings: 1,
    battingTeam: battingTeamName,
    bowlingTeam: bowlingTeamName,
    battingPlayers: JSON.parse(JSON.stringify(battingTeam.players)),
    bowlingPlayers: JSON.parse(JSON.stringify(bowlingTeam.players)),
    striker: "",
    nonStriker: "",
    currentBowler: "",
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    ballHistory: [],
    firstInningsRuns: null,
    completed: false
  };

  const availableBatters = match.battingPlayers.filter(
    player => player.role === "Batter" || player.role === "All-Rounder" || player.role === "Keeper"
  );

  const bowlers = match.bowlingPlayers.filter(
    player => player.role === "Bowler" || player.role === "All-Rounder"
  );

  if (availableBatters.length < 2) {
    alert("Batting team needs at least two batters, all-rounders, or keepers.");
    return;
  }

  if (bowlers.length < 1) {
    alert("Bowling team needs at least one bowler or all-rounder.");
    return;
  }

  match.striker = availableBatters[0].name;
  match.nonStriker = availableBatters[1].name;
  match.currentBowler = bowlers[0].name;

  saveMatch();
  showMatchSection();
}

function showMatchSection() {
  document.getElementById("teams-section").classList.add("hidden");
  document.getElementById("match-setup-section").classList.add("hidden");
  document.getElementById("match-section").classList.remove("hidden");

  document.getElementById("battingTeamName").textContent = match.battingTeam;
  document.getElementById("totalOversText").textContent = match.totalOvers;

  fillPlayerSelects();
  updateDisplay();
}

function fillPlayerSelects() {
  const strikerSelect = document.getElementById("strikerSelect");
  const nonStrikerSelect = document.getElementById("nonStrikerSelect");
  const bowlerSelect = document.getElementById("bowlerSelect");

  strikerSelect.innerHTML = "";
  nonStrikerSelect.innerHTML = "";
  bowlerSelect.innerHTML = "";

  match.battingPlayers.forEach(player => {
    if (!player.out) {
      const option = document.createElement("option");
      option.value = player.name;
      option.textContent = `${player.name} (${player.role})`;

      if (player.name === match.striker) option.selected = true;
      strikerSelect.appendChild(option);

      const option2 = document.createElement("option");
      option2.value = player.name;
      option2.textContent = `${player.name} (${player.role})`;

      if (player.name === match.nonStriker) option2.selected = true;
      nonStrikerSelect.appendChild(option2);
    }
  });

  match.bowlingPlayers.forEach(player => {
    if (player.role === "Bowler" || player.role === "All-Rounder") {
      const option = document.createElement("option");
      option.value = player.name;
      option.textContent = `${player.name} (${player.role})`;

      if (player.name === match.currentBowler) option.selected = true;
      bowlerSelect.appendChild(option);
    }
  });

  strikerSelect.onchange = () => {
    match.striker = strikerSelect.value;
    saveMatch();
    updateDisplay();
  };

  nonStrikerSelect.onchange = () => {
    match.nonStriker = nonStrikerSelect.value;
    saveMatch();
    updateDisplay();
  };

  bowlerSelect.onchange = () => {
    match.currentBowler = bowlerSelect.value;
    saveMatch();
  };
}

function getPlayer(list, name) {
  return list.find(player => player.name === name);
}

function addRuns(runs) {
  const striker = getPlayer(match.battingPlayers, match.striker);
  const bowler = getPlayer(match.bowlingPlayers, match.currentBowler);

  if (!striker || !bowler) return;

  striker.runs += runs;
  striker.balls += 1;
  striker.status = "Batting";

  if (runs === 4) striker.fours += 1;
  if (runs === 6) striker.sixes += 1;

  match.runs += runs;
  bowler.bowlingRuns += runs;
  bowler.bowlingBalls += 1;
  match.legalBalls += 1;

  match.ballHistory.push(runs);

  if (runs % 2 === 1) {
    swapBatters();
  }

  checkInningsEnd();
  saveMatch();
  updateDisplay();
}

function addExtra(type) {
  const bowler = getPlayer(match.bowlingPlayers, match.currentBowler);
  if (!bowler) return;

  match.runs += 1;
  bowler.bowlingRuns += 1;

  let label = "";

  if (type === "wide") {
    label = "WD";
  } else if (type === "noball") {
    label = "NB";
  } else if (type === "bye") {
    label = "B";
    bowler.bowlingBalls += 1;
    match.legalBalls += 1;
  } else if (type === "legbye") {
    label = "LB";
    bowler.bowlingBalls += 1;
    match.legalBalls += 1;
  }

  match.ballHistory.push(label);

  checkInningsEnd();
  saveMatch();
  updateDisplay();
}

function addWicket() {
  const striker = getPlayer(match.battingPlayers, match.striker);
  const bowler = getPlayer(match.bowlingPlayers, match.currentBowler);

  if (!striker || !bowler) return;

  striker.out = true;
  striker.status = "Out";

  bowler.wickets += 1;
  bowler.bowlingBalls += 1;
  match.legalBalls += 1;
  match.wickets += 1;

  match.ballHistory.push("W");

  const nextBatter = match.battingPlayers.find(
    player =>
      !player.out &&
      player.name !== match.striker &&
      player.name !== match.nonStriker &&
      (player.role === "Batter" || player.role === "All-Rounder" || player.role === "Keeper")
  );

  if (nextBatter) {
    match.striker = nextBatter.name;
    striker.status = "Out";
  }

  checkInningsEnd();
  saveMatch();
  fillPlayerSelects();
  updateDisplay();
}

function swapBatters() {
  const temp = match.striker;
  match.striker = match.nonStriker;
  match.nonStriker = temp;

  saveMatch();
  fillPlayerSelects();
  updateDisplay();
}

function oversText(balls) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function calculateRunRate() {
  if (match.legalBalls === 0) return "0.00";
  return ((match.runs / match.legalBalls) * 6).toFixed(2);
}

function checkInningsEnd() {
  const totalBalls = match.totalOvers * 6;
  const allOut = match.wickets >= 10;

  if (match.legalBalls >= totalBalls || allOut) {
    endInnings();
  }
}

function endInnings() {
  if (match.innings === 1) {
    match.firstInningsRuns = match.runs;
    match.innings = 2;

    const tempTeam = match.battingTeam;
    match.battingTeam = match.bowlingTeam;
    match.bowlingTeam = tempTeam;

    const tempPlayers = match.battingPlayers;
    match.battingPlayers = match.bowlingPlayers;
    match.bowlingPlayers = tempPlayers;

    match.runs = 0;
    match.wickets = 0;
    match.legalBalls = 0;
    match.ballHistory = [];

    const availableBatters = match.battingPlayers.filter(
      player => player.role === "Batter" || player.role === "All-Rounder" || player.role === "Keeper"
    );

    const bowlers = match.bowlingPlayers.filter(
      player => player.role === "Bowler" || player.role === "All-Rounder"
    );

    if (availableBatters.length < 2 || bowlers.length < 1) {
      alert("Second innings cannot start. Please check player roles.");
      return;
    }

    match.striker = availableBatters[0].name;
    match.nonStriker = availableBatters[1].name;
    match.currentBowler = bowlers[0].name;

    saveMatch();
    fillPlayerSelects();
    updateDisplay();
    alert("First innings ended. Second innings started.");
  } else {
    match.completed = true;
    saveMatch();
    updateDisplay();
    showResult();
  }
}

function showResult() {
  const target = match.firstInningsRuns + 1;

  if (match.runs >= target) {
    alert(`${match.battingTeam} won by ${10 - match.wickets} wickets.`);
  } else if (match.runs === match.firstInningsRuns) {
    alert("Match tied.");
  } else {
    alert(`${match.bowlingTeam} won by ${match.firstInningsRuns - match.runs} runs.`);
  }
}

function updateDisplay() {
  document.getElementById("teamRuns").textContent = match.runs;
  document.getElementById("teamWickets").textContent = match.wickets;
  document.getElementById("overs").textContent = oversText(match.legalBalls);
  document.getElementById("runRate").textContent = calculateRunRate();
  document.getElementById("battingTeamName").textContent = match.battingTeam;

  if (match.innings === 2 && match.firstInningsRuns !== null) {
    const target = match.firstInningsRuns + 1;
    const ballsLeft = match.totalOvers * 6 - match.legalBalls;
    const runsNeeded = target - match.runs;

    document.getElementById("targetInfo").textContent =
      `Target: ${target} | Need ${Math.max(runsNeeded, 0)} runs from ${Math.max(ballsLeft, 0)} balls`;
  } else {
    document.getElementById("targetInfo").textContent = "";
  }

  updateBattingTable();
  updateBowlingTable();
  updateBallHistory();
}

function updateBattingTable() {
  const tbody = document.querySelector("#battingTable tbody");
  tbody.innerHTML = "";

  match.battingPlayers.forEach(player => {
    const strikeRate = player.balls === 0 ? "0.00" : ((player.runs / player.balls) * 100).toFixed(2);

    let status = player.status;

    if (player.name === match.striker) status = "Striker";
    else if (player.name === match.nonStriker) status = "Non-Striker";
    else if (player.out) status = "Out";
    else if (player.balls > 0) status = "Not Out";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${player.name}</td>
      <td>${player.role}</td>
      <td>${player.runs}</td>
      <td>${player.balls}</td>
      <td>${player.fours}</td>
      <td>${player.sixes}</td>
      <td>${strikeRate}</td>
      <td>${status}</td>
    `;

    tbody.appendChild(row);
  });
}

function updateBowlingTable() {
  const tbody = document.querySelector("#bowlingTable tbody");
  tbody.innerHTML = "";

  match.bowlingPlayers.forEach(player => {
    const economy = player.bowlingBalls === 0
      ? "0.00"
      : ((player.bowlingRuns / player.bowlingBalls) * 6).toFixed(2);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${player.name}</td>
      <td>${player.role}</td>
      <td>${oversText(player.bowlingBalls)}</td>
      <td>${player.bowlingRuns}</td>
      <td>${player.wickets}</td>
      <td>${economy}</td>
    `;

    tbody.appendChild(row);
  });
}

function updateBallHistory() {
  const history = document.getElementById("ballHistory");
  history.innerHTML = "";

  match.ballHistory.forEach(ball => {
    const span = document.createElement("span");
    span.className = "ball";

    if (ball === "W") span.classList.add("wicket");
    if (["WD", "NB", "B", "LB"].includes(ball)) span.classList.add("extra");

    span.textContent = ball;
    history.appendChild(span);
  });
}

function saveMatch() {
  localStorage.setItem("cricketMatch", JSON.stringify(match));
}

function loadSavedMatch() {
  const savedMatch = localStorage.getItem("cricketMatch");
  const savedTeams = localStorage.getItem("cricketTeams");

  if (!savedMatch || !savedTeams) {
    alert("No saved match found.");
    return;
  }

  teams = JSON.parse(savedTeams);
  match = JSON.parse(savedMatch);

  showMatchSection();
}

function resetMatch() {
  if (!confirm("Are you sure you want to reset the match?")) return;

  localStorage.removeItem("cricketMatch");
  location.reload();
}
