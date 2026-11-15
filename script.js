let match = null;

function startMatch() {
  const team1 = document.getElementById("team1").value.trim();
  const team2 = document.getElementById("team2").value.trim();
  const totalOvers = Number(document.getElementById("totalOvers").value);

  if (!team1 || !team2 || totalOvers < 1) {
    alert("Please enter both team names and a valid number of overs.");
    return;
  }

  match = {
    team1,
    team2,
    totalOvers,
    innings: 1,
    battingTeam: team1,
    bowlingTeam: team2,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    batters: [],
    bowlers: [],
    currentBatter: "",
    currentBowler: "",
    ballHistory: [],
    firstInningsRuns: null,
    completed: false
  };

  for (let i = 1; i <= 11; i++) {
    match.batters.push({
      name: `${team1} Player ${i}`,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
      status: "Not Out"
    });

    match.bowlers.push({
      name: `${team2} Player ${i}`,
      balls: 0,
      runs: 0,
      wickets: 0
    });
  }

  match.currentBatter = match.batters[0].name;
  match.currentBowler = match.bowlers[0].name;

  saveMatch();
  showMatchSection();
}

function showMatchSection() {
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("match-section").classList.remove("hidden");

  document.getElementById("battingTeamName").textContent = match.battingTeam;
  document.getElementById("totalOversText").textContent = match.totalOvers;

  fillPlayerSelects();
  updateDisplay();
}

function fillPlayerSelects() {
  const batterSelect = document.getElementById("batterSelect");
  const bowlerSelect = document.getElementById("bowlerSelect");

  batterSelect.innerHTML = "";
  bowlerSelect.innerHTML = "";

  match.batters.forEach(player => {
    if (!player.out) {
      const option = document.createElement("option");
      option.value = player.name;
      option.textContent = player.name;
      if (player.name === match.currentBatter) option.selected = true;
      batterSelect.appendChild(option);
    }
  });

  match.bowlers.forEach(player => {
    const option = document.createElement("option");
    option.value = player.name;
    option.textContent = player.name;
    if (player.name === match.currentBowler) option.selected = true;
    bowlerSelect.appendChild(option);
  });

  batterSelect.onchange = () => {
    match.currentBatter = batterSelect.value;
    saveMatch();
  };

  bowlerSelect.onchange = () => {
    match.currentBowler = bowlerSelect.value;
    saveMatch();
  };
}

function getBatter(name) {
  return match.batters.find(player => player.name === name);
}

function getBowler(name) {
  return match.bowlers.find(player => player.name === name);
}

function addRuns(runs) {
  const batter = getBatter(match.currentBatter);
  const bowler = getBowler(match.currentBowler);

  if (!batter || !bowler) return;

  batter.runs += runs;
  batter.balls += 1;

  if (runs === 4) batter.fours += 1;
  if (runs === 6) batter.sixes += 1;

  match.runs += runs;
  bowler.runs += runs;
  bowler.balls += 1;
  match.legalBalls += 1;

  match.ballHistory.push(runs);

  checkInningsEnd();
  saveMatch();
  updateDisplay();
}

function addExtra(type) {
  const bowler = getBowler(match.currentBowler);
  if (!bowler) return;

  let runs = 1;

  match.runs += runs;
  bowler.runs += runs;

  let label = type === "wide" ? "WD" : type === "noball" ? "NB" : type === "bye" ? "B" : "LB";

  if (type === "wide" || type === "noball") {
    match.ballHistory.push(label);
  } else {
    bowler.balls += 1;
    match.legalBalls += 1;
    match.ballHistory.push(label);
  }

  checkInningsEnd();
  saveMatch();
  updateDisplay();
}

function addWicket() {
  const batter = getBatter(match.currentBatter);
  const bowler = getBowler(match.currentBowler);

  if (!batter || !bowler) return;

  batter.out = true;
  batter.status = "Out";
  bowler.wickets += 1;
  bowler.balls += 1;
  match.legalBalls += 1;
  match.wickets += 1;

  match.ballHistory.push("W");

  const nextBatter = match.batters.find(player => !player.out && player.name !== match.currentBatter);

  if (nextBatter) {
    match.currentBatter = nextBatter.name;
  }

  checkInningsEnd();
  saveMatch();
  updateDisplay();
}

function oversText(balls) {
  const overs = Math.floor(balls / 6);
  const remaining = balls % 6;
  return `${overs}.${remaining}`;
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

    const temp = match.battingTeam;
    match.battingTeam = match.bowlingTeam;
    match.bowlingTeam = temp;

    match.runs = 0;
    match.wickets = 0;
    match.legalBalls = 0;
    match.ballHistory = [];

    match.batters = [];
    match.bowlers = [];

    for (let i = 1; i <= 11; i++) {
      match.batters.push({
        name: `${match.battingTeam} Player ${i}`,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        out: false,
        status: "Not Out"
      });

      match.bowlers.push({
        name: `${match.bowlingTeam} Player ${i}`,
        balls: 0,
        runs: 0,
        wickets: 0
      });
    }

    match.currentBatter = match.batters[0].name;
    match.currentBowler = match.bowlers[0].name;

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

  match.batters.forEach(player => {
    const strikeRate = player.balls === 0 ? "0.00" : ((player.runs / player.balls) * 100).toFixed(2);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${player.name}</td>
      <td>${player.runs}</td>
      <td>${player.balls}</td>
      <td>${player.fours}</td>
      <td>${player.sixes}</td>
      <td>${strikeRate}</td>
      <td>${player.out ? "Out" : player.name === match.currentBatter ? "Batting" : "Not Out"}</td>
    `;
    tbody.appendChild(row);
  });
}

function updateBowlingTable() {
  const tbody = document.querySelector("#bowlingTable tbody");
  tbody.innerHTML = "";

  match.bowlers.forEach(player => {
    const economy = player.balls === 0 ? "0.00" : ((player.runs / player.balls) * 6).toFixed(2);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${player.name}</td>
      <td>${oversText(player.balls)}</td>
      <td>${player.runs}</td>
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
  const saved = localStorage.getItem("cricketMatch");

  if (!saved) {
    alert("No saved match found.");
    return;
  }

  match = JSON.parse(saved);
  showMatchSection();
}

function resetMatch() {
  if (!confirm("Are you sure you want to reset the match?")) return;

  localStorage.removeItem("cricketMatch");
  location.reload();
}
