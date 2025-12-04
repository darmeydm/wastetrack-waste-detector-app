// ===== Demo data =====

// Simple dish list
const dishes = [
  { id: "jerk-chicken", name: "Jerk Chicken", station: "Global Grill" },
  { id: "veggie-pasta", name: "Veggie Pasta", station: "Pasta Bar" },
  { id: "baked-fish", name: "Baked Fish", station: "Home Zone" },
  { id: "tacos", name: "Beef Tacos", station: "Tex-Mex" },
  { id: "stir-fry", name: "Veggie Stir Fry", station: "Action Station" },
  { id: "pizza", name: "Cheese Pizza", station: "Pizza" }
];

// Menu by weekday (keys must match the ones we use)
const menuByDay = {
  Mon: ["jerk-chicken", "veggie-pasta", "pizza"],
  Tue: ["baked-fish", "stir-fry", "pizza"],
  Wed: ["tacos", "veggie-pasta", "pizza"],
  Thu: ["jerk-chicken", "baked-fish", "stir-fry"],
  Fri: ["tacos", "veggie-pasta", "pizza"]
};

// Availability statuses
const availability = {
  "jerk-chicken": "available",
  "veggie-pasta": "available",
  "baked-fish": "low",
  tacos: "available",
  "stir-fry": "soldout",
  pizza: "available"
};

// Student votes: day -> dishId -> count
const votes = {
  Mon: { "jerk-chicken": 12, "veggie-pasta": 8, pizza: 15 },
  Tue: { "baked-fish": 6, "stir-fry": 10, pizza: 9 },
  Wed: { tacos: 18, "veggie-pasta": 5, pizza: 13 },
  Thu: { "jerk-chicken": 11, "baked-fish": 4, "stir-fry": 7 },
  Fri: { tacos: 20, "veggie-pasta": 9, pizza: 14 }
};

// Waste logs (starts with some seeded demo entries)
const wasteLogs = [
  { date: "Mon", dishId: "jerk-chicken", prepared: 60, served: 48, wasted: 12 },
  { date: "Mon", dishId: "veggie-pasta", prepared: 40, served: 30, wasted: 10 },
  { date: "Tue", dishId: "baked-fish", prepared: 50, served: 36, wasted: 14 },
  { date: "Wed", dishId: "tacos", prepared: 80, served: 70, wasted: 10 }
];

// Accuracy responses: { todayKey: { dishId: { yes, no } } }
const accuracyVotes = {};

// ===== Helper functions =====

function getTodayKey() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const idx = new Date().getDay();
  const key = days[idx];
  // If weekend, just show Monday data to avoid empty demo
  if (key === "Sat" || key === "Sun") return "Mon";
  return key;
}

function getDishById(id) {
  return dishes.find(d => d.id === id);
}

// ===== View switching =====

const views = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll(".nav-btn");
const heroNavButtons = document.querySelectorAll("[data-view]");

function showView(id) {
  views.forEach(v => v.classList.toggle("active", v.id === id));
  navButtons.forEach(btn =>
    btn.classList.toggle("active", btn.dataset.view === id)
  );
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

// hero buttons
heroNavButtons.forEach(btn => {
  if (!btn.classList.contains("nav-btn")) {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  }
});

// ===== Student: Today in Schulze =====

function renderTodayDishes() {
  const todayKey = getTodayKey();
  const container = document.getElementById("today-dishes");
  container.innerHTML = "";

  const todayMenu = menuByDay[todayKey] || [];
  todayMenu.forEach(dishId => {
    const dish = getDishById(dishId);
    const status = availability[dishId] || "available";
    const card = document.createElement("article");
    card.className = "card";

    const statusText =
      status === "available"
        ? "Available"
        : status === "low"
        ? "Low stock"
        : "Sold out";

    card.innerHTML = `
      <div class="card-title">${dish.name}</div>
      <div class="card-meta">${dish.station} • ${todayKey}</div>
      <span class="status-pill status-${status}">${statusText}</span>
    `;
    container.appendChild(card);
  });

  const lastUpdated = document.getElementById("last-updated");
  const now = new Date();
  lastUpdated.textContent =
    "Last updated: " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ===== Student: Voting =====

function initVoteDaySelect() {
  const select = document.getElementById("vote-day-select");
  select.innerHTML = "";
  Object.keys(menuByDay).forEach(dayKey => {
    const opt = document.createElement("option");
    opt.value = dayKey;
    opt.textContent = dayKey;
    select.appendChild(opt);
  });
  select.addEventListener("change", () =>
    renderVoteDishes(select.value)
  );
  renderVoteDishes(select.value || getTodayKey());
}

function renderVoteDishes(dayKey) {
  const container = document.getElementById("vote-dishes");
  container.innerHTML = "";
  const menu = menuByDay[dayKey] || [];
  const dayVotes = votes[dayKey] || {};
  const maxVotes = Math.max(
    1,
    ...menu.map(d => dayVotes[d] || 0)
  );

  menu.forEach(dishId => {
    const dish = getDishById(dishId);
    const count = dayVotes[dishId] || 0;
    const widthPercent = (count / maxVotes) * 100;

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-title">${dish.name}</div>
      <div class="card-meta">Current votes: <strong>${count}</strong> (${dayKey})</div>
      <div class="vote-bar">
        <div class="vote-bar-fill" style="width: ${widthPercent}%"></div>
      </div>
    `;

    const btn = document.createElement("button");
    btn.textContent = "Vote for this meal";
    btn.className = "vote-btn";
    btn.addEventListener("click", () => {
      // increment vote
      if (!votes[dayKey]) votes[dayKey] = {};
      votes[dayKey][dishId] = (votes[dayKey][dishId] || 0) + 1;
      renderVoteDishes(dayKey);
      updateVotesChart();
    });

    card.appendChild(btn);
    container.appendChild(card);
  });
}

// ===== Student: Accuracy (“Reality Check”) =====

function renderAccuracyForm() {
  const todayKey = getTodayKey();
  const form = document.getElementById("accuracy-form");
  form.innerHTML = "";
  const todayMenu = menuByDay[todayKey] || [];

  todayMenu.forEach(dishId => {
    const dish = getDishById(dishId);
    const row = document.createElement("div");
    row.className = "accuracy-row";

    const left = document.createElement("span");
    left.textContent = dish.name;

    const right = document.createElement("div");
    const yesId = `acc-${dishId}-yes`;
    const noId = `acc-${dishId}-no`;

    right.innerHTML = `
      <label><input type="radio" name="acc-${dishId}" value="yes" id="${yesId}" />Yes</label>
      <label><input type="radio" name="acc-${dishId}" value="no" id="${noId}" />No</label>
    `;

    row.appendChild(left);
    row.appendChild(right);
    form.appendChild(row);
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "primary";
  submitBtn.textContent = "Submit reality check";
  form.appendChild(submitBtn);

  form.addEventListener("submit", handleAccuracySubmit);
}

function handleAccuracySubmit(event) {
  event.preventDefault();
  const todayKey = getTodayKey();
  const todayMenu = menuByDay[todayKey] || [];
  if (!accuracyVotes[todayKey]) accuracyVotes[todayKey] = {};

  let yesCount = 0;
  let totalResponses = 0;

  todayMenu.forEach(dishId => {
    const radios = document.getElementsByName(`acc-${dishId}`);
    let value = null;
    radios.forEach(r => {
      if (r.checked) value = r.value;
    });
    if (!value) return;
    totalResponses++;
    if (!accuracyVotes[todayKey][dishId])
      accuracyVotes[todayKey][dishId] = { yes: 0, no: 0 };
    accuracyVotes[todayKey][dishId][value]++;

    if (value === "yes") yesCount++;
  });

  const result = document.getElementById("accuracy-result");
  if (totalResponses === 0) {
    result.textContent = "Select at least one response before submitting.";
    return;
  }
  const accuracyPercent = Math.round((yesCount / totalResponses) * 100);
  result.textContent =
    "Thank you! Today’s menu accuracy from your responses: " +
    accuracyPercent +
    "%.";
}

// ===== Staff: Waste logging and stats =====

const wasteDishSelect = document.getElementById("waste-dish-select");
const wasteForm = document.getElementById("waste-form");
const wasteFormMsg = document.getElementById("waste-form-message");

function initWasteForm() {
  // Fill dish dropdown
  dishes.forEach(dish => {
    const opt = document.createElement("option");
    opt.value = dish.id;
    opt.textContent = dish.name;
    wasteDishSelect.appendChild(opt);
  });

  wasteForm.addEventListener("submit", event => {
    event.preventDefault();
    const dayKey = getTodayKey();
    const dishId = document.getElementById("waste-dish-select").value;
    const meal = document.getElementById("waste-meal-select").value;
    const prepared = Number(
      document.getElementById("waste-prepared").value
    );
    const served = Number(
      document.getElementById("waste-served").value
    );
    const wasted = Number(
      document.getElementById("waste-wasted").value
    );

    if (prepared < served + wasted) {
      wasteFormMsg.textContent =
        "Prepared should be at least served + wasted.";
      return;
    }

    wasteLogs.push({ date: dayKey, meal, dishId, prepared, served, wasted });
    wasteForm.reset();
    wasteFormMsg.textContent = "Log added (demo only).";
    refreshStatsAndCharts();
  });
}

function calculateTodayTotals() {
  const dayKey = getTodayKey();
  let prepared = 0;
  let served = 0;
  let wasted = 0;

  wasteLogs.forEach(log => {
    if (log.date === dayKey) {
      prepared += log.prepared;
      served += log.served;
      wasted += log.wasted;
    }
  });

  return { prepared, served, wasted };
}

function updateSnapshot() {
  const totals = calculateTodayTotals();
  document.getElementById("stat-prepared").textContent = totals.prepared;
  document.getElementById("stat-served").textContent = totals.served;
  document.getElementById("stat-wasted").textContent = totals.wasted;
}

// ===== Charts (Chart.js) =====

let wasteChart;
let votesChart;

function buildWasteChart() {
  const ctx = document.getElementById("wasteByDishChart");
  if (!ctx) return;

  const labels = dishes.map(d => d.name);
  const data = dishes.map(dish => {
    return wasteLogs
      .filter(log => log.dishId === dish.id)
      .reduce((sum, log) => sum + log.wasted, 0);
  });

  if (wasteChart) wasteChart.destroy();
  wasteChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Total wasted portions",
          data
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function buildVotesChart() {
  const ctx = document.getElementById("votesByDishChart");
  if (!ctx) return;

  const labels = dishes.map(d => d.name);
  const data = dishes.map(dish => {
    let total = 0;
    Object.values(votes).forEach(dayVotes => {
      if (dayVotes[dish.id]) total += dayVotes[dish.id];
    });
    return total;
  });

  if (votesChart) votesChart.destroy();
  votesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Total student votes",
          data
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function refreshStatsAndCharts() {
  updateSnapshot();
  buildWasteChart();
  buildVotesChart();
}

function updateVotesChart() {
  buildVotesChart();
}

// ===== Initial setup =====

window.addEventListener("DOMContentLoaded", () => {
  renderTodayDishes();
  initVoteDaySelect();
  renderAccuracyForm();
  initWasteForm();
  refreshStatsAndCharts();
});
