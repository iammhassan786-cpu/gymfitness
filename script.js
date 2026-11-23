
const $ = id => document.getElementById(id);

const ADMIN_EMAIL = "admin@gymfitness.local";
const ADMIN_PASSWORD = "GymAdmin123";

const defaultPlans = [
  {
    id: 1, name: "Full Body Starter",
    level: "Beginner", duration: "20 minutes",
    description: "A simple full-body introduction.",
    exercises: ["Jumping Jacks", "Bodyweight Squats", "Wall Push-ups", "Plank"]
  },
  {
    id: 2, name: "Strength Builder",
    level: "Intermediate", duration: "30 minutes",
    description: "Build strength with basic movements.",
    exercises: ["Squats", "Push-ups", "Lunges", "Plank"]
  },
  {
    id: 3, name: "Active Fitness",
    level: "Beginner", duration: "15 minutes",
    description: "A gentle routine to stay active.",
    exercises: ["Walking", "Marching in Place", "Arm Circles", "Stretching"]
  },
  {
    id: 4, name: "Endurance Training",
    level: "Advanced", duration: "35 minutes",
    description: "A challenging cardio and conditioning routine.",
    exercises: ["High Knees", "Squats", "Mountain Climbers", "Plank"]
  }
];

const exerciseLibrary = [
  {name:"Jumping Jacks", type:"Cardio", description:"A full-body movement that increases your heart rate."},
  {name:"Bodyweight Squats", type:"Strength", description:"Bend your knees and hips while keeping your balance."},
  {name:"Wall Push-ups", type:"Strength", description:"Push gently against a wall while maintaining a straight body."},
  {name:"Plank", type:"Core", description:"Hold a stable position with your body aligned."},
  {name:"Lunges", type:"Strength", description:"Step forward and bend both knees comfortably."},
  {name:"Walking", type:"Cardio", description:"Walk at a comfortable pace."},
  {name:"Marching in Place", type:"Cardio", description:"Lift your knees alternately while standing."},
  {name:"Arm Circles", type:"Mobility", description:"Move your arms in controlled circular motions."},
  {name:"Stretching", type:"Mobility", description:"Use gentle movements to improve flexibility."},
  {name:"High Knees", type:"Cardio", description:"March or jog while lifting your knees."},
  {name:"Mountain Climbers", type:"Cardio", description:"Move your knees forward alternately from a supported position."}
];

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let users = read("gf_users", []);
let plans = read("gf_plans", defaultPlans);
let currentUser = read("gf_session", null);
let registerMode = false;

if (!Array.isArray(users)) users = [];
if (!Array.isArray(plans)) plans = defaultPlans;

function getUser() {
  return users.find(u => u.email === currentUser?.email);
}

function getUserTracker() {
  const user = getUser();
  if (!user) return {};
  if (!user.tracker || typeof user.tracker !== "object") user.tracker = {};
  const today = new Date().toISOString().slice(0,10);
  if (!user.tracker[today]) user.tracker[today] = [];
  return user.tracker[today];
}

function updateUser() {
  save("gf_users", users);
  save("gf_session", currentUser);
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").style.display = "block";
  setTimeout(() => $("toast").style.display = "none", 2500);
}

// AUTHENTICATION

function showAuth() {
  $("auth").classList.remove("hidden");
  $("app").classList.add("hidden");
  $("authName").classList.toggle("hidden", !registerMode);
  $("authTitle").textContent = registerMode ? "Create Account" : "Welcome Back!";
  $("authSubmit").textContent = registerMode ? "Sign Up" : "Login";
  $("toggleAuth").textContent = registerMode ? "Already have an account? Login" : "Create an account";
}

$("toggleAuth").onclick = () => {
  registerMode = !registerMode;
  $("authMessage").textContent = "";
  showAuth();
};

$("authForm").onsubmit = event => {
  event.preventDefault();

  const name = $("authName").value.trim();
  const email = $("authEmail").value.trim().toLowerCase();
  const password = $("authPassword").value;

  if (password.length < 6) {
    $("authMessage").textContent = "Password must contain at least 6 characters.";
    return;
  }

  if (registerMode) {
    if (!name) {
      $("authMessage").textContent = "Please enter your name.";
      return;
    }

    if (email === ADMIN_EMAIL) {
      $("authMessage").textContent = "This email is reserved.";
      return;
    }

    if (users.some(u => u.email === email)) {
      $("authMessage").textContent = "This account already exists.";
      return;
    }

    users.push({
      name, email, password,
      goal: "General Fitness",
      tracker: {},
      history: []
    });

    updateUser();
    toast("Account created!");
  } else {
    const adminLogin = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    const user = users.find(u => u.email === email && u.password === password);

    if (!adminLogin && !user) {
      $("authMessage").textContent = "Incorrect email or password.";
      return;
    }
  }

  currentUser = {email};
  save("gf_session", currentUser);
  $("authForm").reset();
  openApp();
};

$("logout").onclick = () => {
  currentUser = null;
  save("gf_session", null);
  showAuth();
};

// NAVIGATION

function goTo(page) {
  if (page === "admin" && !isAdmin()) {
    toast("Admin access required.");
    return;
  }

  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  $(page).classList.remove("hidden");

  document.querySelectorAll(".nav button").forEach(b => {
    b.classList.toggle("active", b.dataset.page === page);
  });

  const titles = {
    dashboard:"Dashboard",
    workouts:"Workout Plans",
    exercises:"Exercise Library",
    tracker:"Daily Tracker",
    profile:"My Profile",
    admin:"Admin Panel"
  };

  $("pageTitle").textContent = titles[page];
  if (page === "dashboard") renderDashboard();
  if (page === "workouts") renderPlans();
  if (page === "exercises") renderExercises();
  if (page === "tracker") renderTracker();
  if (page === "profile") renderProfile();
  if (page === "admin") renderAdmin();
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.onclick = () => goTo(button.dataset.page);
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.onclick = () => goTo(button.dataset.go);
});

function isAdmin() {
  return currentUser?.email === ADMIN_EMAIL;
}

// APPLICATION

function openApp() {
  if (!currentUser) {
    showAuth();
    return;
  }

  $("auth").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("adminNav").classList.toggle("hidden", !isAdmin());
  $("userChip").textContent = isAdmin() ? "Administrator" : getUser()?.name || "Member";
  goTo("dashboard");
}

function renderDashboard() {
  const user = getUser();
  const done = user?.history?.length || 0;
  const today = getUserTracker();

  $("totalDone").textContent = done;
  $("todayDone").textContent =
    (today.length ? Math.round(today.length / getTodayExercises().length * 100) : 0) + "%";
  $("planCount").textContent = plans.length;

  $("todayWorkout").innerHTML = `
    <div class="workout-card">
      <div class="tag">DAILY FITNESS</div>
      <h3>Today's Exercise Routine</h3>
      <p>${getTodayExercises().length} exercises available. Track your progress and take breaks when needed.</p>
      <button class="primary" onclick="goTo('tracker')">Start Tracking</button>
    </div>`;
}

function renderPlans() {
  $("workoutCards").innerHTML = plans.map(plan => `
    <div class="workout-card">
      <div class="tag">${escapeHTML(plan.level.toUpperCase())}</div>
      <h3>${escapeHTML(plan.name)}</h3>
      <p>${escapeHTML(plan.description)}</p>
      <p>⏱ ${escapeHTML(plan.duration)}</p>
      <p>Exercises: ${plan.exercises.length}</p>
      <button class="primary" onclick="startPlan(${plan.id})">Start Plan</button>
    </div>
  `).join("") || "<p>No workout plans available.</p>";
}

function startPlan(id) {
  const plan = plans.find(p => p.id === id);
  if (!plan) return;

  if (!isAdmin()) {
    const user = getUser();
    const today = new Date().toISOString().slice(0,10);
    user.selectedPlan = id;
    user.tracker[today] = [];
    updateUser();
  }

  renderTracker();
  goTo("tracker");
  toast(plan.name + " selected!");
}

function getTodayExercises() {
  const user = getUser();
  const selected = plans.find(p => p.id === user?.selectedPlan);
  return selected ? selected.exercises : plans[0]?.exercises || [];
}

// EXERCISES

function renderExercises() {
  const query = $("exerciseSearch").value.toLowerCase();

  const results = exerciseLibrary.filter(ex =>
    ex.name.toLowerCase().includes(query) ||
    ex.type.toLowerCase().includes(query)
  );

  $("exerciseCards").innerHTML = results.map(ex => `
    <div class="exercise-card">
      <div class="tag">${escapeHTML(ex.type)}</div>
      <h3>${escapeHTML(ex.name)}</h3>
      <p>${escapeHTML(ex.description)}</p>
    </div>
  `).join("") || "<p>No exercises found.</p>";
}

$("exerciseSearch").oninput = renderExercises;

// TRACKER

function renderTracker() {
  if (isAdmin()) {
    $("trackerList").innerHTML = "<p>Login as a member to use the personal tracker.</p>";
    return;
  }

  const exercises = getTodayExercises();
  const completed = getUserTracker();

  $("trackerList").innerHTML = exercises.map((name, index) => `
    <div class="tracker-row">
      <label for="exercise${index}">${escapeHTML(name)}</label>
      <input id="exercise${index}" type="checkbox"
        ${completed.includes(name) ? "checked" : ""}
        onchange="toggleExercise('${escapeJS(name)}', this.checked)">
    </div>
  `).join("");

  updateProgress();
}

function toggleExercise(name, checked) {
  const user = getUser();
  if (!user) return;

  const today = new Date().toISOString().slice(0,10);
  const list = getUserTracker();

  if (checked && !list.includes(name)) {
    list.push(name);
    user.history.push({exercise:name, date:today});
  } else if (!checked) {
    user.tracker[today] = list.filter(item => item !== name);
    const index = user.history.findIndex(item =>
      item.exercise === name && item.date === today
    );
    if (index !== -1) user.history.splice(index, 1);
  }

  updateUser();
  updateProgress();
  renderDashboard();
}

function updateProgress() {
  const exercises = getTodayExercises();
  const done = getUserTracker().length;
  const percent = exercises.length ? Math.round(done / exercises.length * 100) : 0;

  $("progressBar").style.width = percent + "%";
  $("progressText").textContent = percent + "% completed (" + done + "/" + exercises.length + ")";
}

$("resetTracker").onclick = () => {
  const user = getUser();
  if (!user) return;

  const today = new Date().toISOString().slice(0,10);
  user.tracker[today] = [];
  user.history = user.history.filter(item => item.date !== today);

  updateUser();
  renderTracker();
  renderDashboard();
  toast("Today's tracker reset.");
};

// PROFILE

function renderProfile() {
  if (isAdmin()) {
    $("profileForm").classList.add("hidden");
    return;
  }

  const user = getUser();
  $("profileForm").classList.remove("hidden");
  $("profileName").value = user.name;
  $("profileEmail").value = user.email;
  $("profileGoal").value = user.goal || "General Fitness";
}

$("profileForm").onsubmit = event => {
  event.preventDefault();
  const user = getUser();
  if (!user) return;

  user.name = $("profileName").value.trim();
  user.goal = $("profileGoal").value;
  updateUser();

  $("userChip").textContent = user.name;
  $("profileMessage").textContent = "Profile saved successfully!";
  toast("Profile updated!");
};

// ADMIN PANEL

function renderAdmin() {
  if (!isAdmin()) return;

  const totalDone = users.reduce((sum, user) =>
    sum + (user.history?.length || 0), 0);

  $("adminUsers").textContent = users.length;
  $("adminPlans").textContent = plans.length;
  $("adminDone").textContent = totalDone;

  $("adminPlanList").innerHTML = plans.map(plan => `
    <div class="admin-item">
      <div>
        <strong>${escapeHTML(plan.name)}</strong>
        <p>${escapeHTML(plan.level)} · ${escapeHTML(plan.duration)}</p>
      </div>
      <button class="danger" onclick="deletePlan(${plan.id})">Delete</button>
    </div>
  `).join("") || "<p>No plans.</p>";

  $("adminUserList").innerHTML = users.map((user, index) => `
    <div class="user-item">
      <div>
        <strong>${escapeHTML(user.name)}</strong>
        <p>${escapeHTML(user.email)}</p>
      </div>
      <span>${user.history?.length || 0} completed</span>
      <button class="danger" onclick="deleteUser(${index})">Delete</button>
    </div>
  `).join("") || "<p>No registered users.</p>";
}

$("planForm").onsubmit = event => {
  event.preventDefault();
  if (!isAdmin()) return;

  const newPlan = {
    id: Date.now(),
    name: $("planName").value.trim(),
    level: $("planLevel").value.trim(),
    duration: $("planDuration").value.trim(),
    description: $("planDescription").value.trim(),
    exercises: $("planExercises").value.split(",")
      .map(x => x.trim()).filter(Boolean)
  };

  if (!newPlan.exercises.length) {
    toast("Add at least one exercise.");
    return;
  }

  plans.push(newPlan);
  save("gf_plans", plans);
  $("planForm").reset();
  renderAdmin();
  toast("New workout added!");
};

function deletePlan(id) {
  if (!isAdmin() || !confirm("Delete this workout plan?")) return;

  plans = plans.filter(plan => plan.id !== id);
  save("gf_plans", plans);
  renderAdmin();
  toast("Workout deleted.");
}

function deleteUser(index) {
  if (!isAdmin() || !confirm("Delete this user account?")) return;

  users.splice(index, 1);
  updateUser();
  renderAdmin();
  toast("User deleted.");
}

// BASIC HTML SAFETY HELPERS

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#39;"
  })[char]);
}

function escapeJS(value) {
  return String(value).replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/[\r\n]/g, " ");
}

// START APPLICATION

if (currentUser && !isAdmin() && !getUser()) {
  currentUser = null;
  save("gf_session", null);
}

openApp();
