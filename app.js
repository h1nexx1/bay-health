// ================= НАВИГАЦИЯ =================
function switchScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`screen-${screenName}`).classList.add('active-screen');

  if (screenName === 'ai') {
    document.body.classList.add('ai-active');
  } else {
    document.body.classList.remove('ai-active');
  }

  if (screenName === 'home') document.getElementById('nav-home').classList.add('active');
  if (screenName === 'progress') {
    document.getElementById('nav-progress').classList.add('active');
    renderProgressScreen();
  }
  if (screenName === 'profile') {
    document.getElementById('nav-profile').classList.add('active');
    updateProfileUI();
  }
  if (screenName === 'achievements') {
    document.getElementById('nav-achievements').classList.add('active');
  }
}

// ================= СТАТИСТИКА И СРЕДНИЕ ЗНАЧЕНИЯ =================
function renderProgressScreen() {
  renderCharts();
  renderStatsMood();
  renderStatsFoodHistory();
  renderSleepCalendar();
  calculateAverages();
}

function renderCharts() {
  const chartSteps = document.getElementById('statsStepsChart');
  const chartCalActive = document.getElementById('statsCalActiveChart');
  const chartCalRest = document.getElementById('statsCalRestChart');

  if (!chartSteps || !chartCalActive || !chartCalRest) return;

  chartSteps.innerHTML = '';
  chartCalActive.innerHTML = '';
  chartCalRest.innerHTML = '';

  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const data = appData.days[getDateKey(d)] || { steps: 0, activeCalories: 0, restCalories: 0 };

    const barS = document.createElement('div'); barS.className = 'chart-bar';
    let hSteps = Math.min((data.steps / 15000) * 100, 100); if (hSteps < 5) hSteps = 5;
    barS.style.height = `${hSteps}%`;
    chartSteps.appendChild(barS);

    const barA = document.createElement('div'); barA.className = 'chart-bar';
    let hActive = Math.min((data.activeCalories / 1000) * 100, 100); if (hActive < 5) hActive = 5;
    barA.style.height = `${hActive}%`;
    chartCalActive.appendChild(barA);

    const barR = document.createElement('div'); barR.className = 'chart-bar';
    let hRest = Math.min((data.restCalories / 2500) * 100, 100); if (hRest < 5) hRest = 5;
    barR.style.height = `${hRest}%`;
    chartCalRest.appendChild(barR);
  }
}

function calculateAverages() {
  let totalSteps = 0, countSteps = 0;
  let totalActive = 0, countActive = 0;
  let totalRest = 0, countRest = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const data = appData.days[getDateKey(d)];
    if (data) {
      if (data.steps > 0) { totalSteps += data.steps; countSteps++; }
      if (data.activeCalories > 0) { totalActive += data.activeCalories; countActive++; }
      if (data.restCalories > 0) { totalRest += data.restCalories; countRest++; }
    }
  }

  const avgStepsEl = document.getElementById('avgSteps');
  const avgActiveEl = document.getElementById('avgActive');
  const avgRestEl = document.getElementById('avgRest');

  if (avgStepsEl) avgStepsEl.innerText = countSteps ? Math.round(totalSteps / countSteps) : 0;
  if (avgActiveEl) avgActiveEl.innerText = countActive ? Math.round(totalActive / countActive) : 0;
  if (avgRestEl) avgRestEl.innerText = countRest ? Math.round(totalRest / countRest) : 0;
}

function renderStatsMood() {
  const list = document.getElementById('statsMoodList');
  if (!list) return;
  list.innerHTML = '';
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const data = appData.days[getDateKey(d)];
    if (data && data.mood) {
      const span = document.createElement('span');
      span.innerText = data.mood;
      span.title = d.toLocaleDateString();
      list.appendChild(span);
    }
  }
  if (list.innerHTML === '') list.innerHTML = '<span style="font-size: 0.8rem; color:#888;">Нет записей</span>';
}

function renderStatsFoodHistory() {
  const container = document.getElementById('statsFoodHistory');
  if (!container) return;
  container.innerHTML = '';
  const allHistory = [];

  Object.keys(appData.days).forEach(dateKey => {
    if (appData.days[dateKey].foodHistory) {
      appData.days[dateKey].foodHistory.forEach(item => {
        allHistory.push({ date: dateKey, ...item });
      });
    }
  });

  allHistory.reverse().slice(0, 20).forEach(item => {
    const div = document.createElement('div');
    div.style.marginBottom = '5px';
    div.innerHTML = `<span style="color:#888">${item.date}:</span> <strong>${item.name}</strong> (${item.calories} ккал)`;
    container.appendChild(div);
  });
  if (container.innerHTML === '') container.innerHTML = '<p style="color:#888;">Нет данных о питании</p>';
}

function renderSleepCalendar() {
  const grid = document.getElementById('sleepCalendar');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const sleep = appData.days[getDateKey(d)] ? appData.days[getDateKey(d)].sleep : null;
    const div = document.createElement('div');
    div.className = 'sleep-day'; div.innerText = d.getDate();
    if (sleep !== null) {
      if (sleep < 6) div.classList.add('bad');
      else if (sleep >= 6 && sleep < 7) div.classList.add('mid');
      else div.classList.add('good');
      div.title = `${sleep} ч сна`;
    }
    grid.appendChild(div);
  }
}

// ================= ИИ-ЧАТ (ДЛЯ NETLIFY) =================
function askAIPreset(question) {
  document.getElementById('aiChatInput').value = question;
  sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('aiChatInput');
  const text = input.value.trim();
  if (!text) return;

  if (aiLimitData.count >= DAILY_AI_LIMIT) {
    alert(`Достигнут дневной лимит (${DAILY_AI_LIMIT} сообщений). Приходи завтра!`);
    return;
  }

  input.value = '';
  const chatBox = document.getElementById('chatBox');

  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user'; userMsg.innerText = text;
  chatBox.appendChild(userMsg); chatBox.scrollTop = chatBox.scrollHeight;

  const botMsg = document.createElement('div');
  botMsg.className = 'chat-msg bot'; botMsg.innerText = "Анализирую данные... ⏳";
  chatBox.appendChild(botMsg); chatBox.scrollTop = chatBox.scrollHeight;

  aiLimitData.count++;
  localStorage.setItem(AI_LIMIT_KEY, JSON.stringify({ date: new Date().toDateString(), count: aiLimitData.count }));
  updateAILimitUI();

  const selectedKey = getDateKey(currentSelectedDate);
  const selectedData = appData.days[selectedKey] || { steps: 0, activeCalories: 0, restCalories: 0, food: 0, sleep: 0, weight: 0, mood: '', moodNote: '', foodHistory: [] };

  // Формируем историю питания
  let foodList = "не записано";
  if (selectedData.foodHistory && selectedData.foodHistory.length > 0) {
    foodList = selectedData.foodHistory.map(item =>
      `${item.name} (${item.calories} ккал, Б:${item.protein || 0} Ж:${item.fat || 0} У:${item.carbs || 0})`
    ).join(', ');
  }

  const prompt = `
Мои данные за ${selectedKey}:
- Возраст: ${appData.profile.age || 'не указан'} лет
- Рост: ${appData.profile.height || 'не указан'} см
- Вес: ${appData.profile.weight || 'не указан'} кг
- Шаги: ${selectedData.steps || 0}
- Сожжено: ${selectedData.activeCalories || 0} ккал
- Покой: ${selectedData.restCalories || 0} ккал
- Съедено: ${selectedData.food || 0} ккал
- Сон: ${selectedData.sleep || 0} ч.
- Настроение: ${selectedData.mood || 'не указано'} ${selectedData.moodNote ? `(Заметка: ${selectedData.moodNote})` : ''}
- Что съел: ${foodList}

Мой вопрос: "${text}"
  `;

  try {
    // ВАЖНО: Здесь мы поменяли путь на функцию Netlify
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    });

    if (!response.ok) throw new Error('Ошибка сервера');

    const data = await response.json();

    // Выводим чистый текст ответа от ИИ
    botMsg.innerText = data.answer;

  } catch (error) {
    botMsg.innerText = "Ошибка ИИ. Проверь соединение.";
    console.error(error);
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}
// ================= НАВИГАЦИЯ =================
function switchScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`screen-${screenName}`).classList.add('active-screen');

  if (screenName === 'ai') {
    document.body.classList.add('ai-active');
  } else {
    document.body.classList.remove('ai-active');
  }

  if (screenName === 'home') document.getElementById('nav-home').classList.add('active');
  if (screenName === 'progress') {
    document.getElementById('nav-progress').classList.add('active');
    renderProgressScreen();
  }
  if (screenName === 'profile') {
    document.getElementById('nav-profile').classList.add('active');
    updateProfileUI();
  }
  if (screenName === 'achievements') {
    document.getElementById('nav-achievements').classList.add('active');
  }
}

// ================= СТАТИСТИКА И СРЕДНИЕ ЗНАЧЕНИЯ =================
function renderProgressScreen() {
  renderCharts();
  renderStatsMood();
  renderStatsFoodHistory();
  renderSleepCalendar();
  calculateAverages();
}

function renderCharts() {
  const chartSteps = document.getElementById('statsStepsChart');
  const chartCalActive = document.getElementById('statsCalActiveChart');
  const chartCalRest = document.getElementById('statsCalRestChart');

  if (!chartSteps || !chartCalActive || !chartCalRest) return;

  chartSteps.innerHTML = '';
  chartCalActive.innerHTML = '';
  chartCalRest.innerHTML = '';

  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const data = appData.days[getDateKey(d)] || { steps: 0, activeCalories: 0, restCalories: 0 };

    const barS = document.createElement('div'); barS.className = 'chart-bar';
    let hSteps = Math.min((data.steps / 15000) * 100, 100); if (hSteps < 5) hSteps = 5;
    barS.style.height = `${hSteps}%`;
    chartSteps.appendChild(barS);

    const barA = document.createElement('div'); barA.className = 'chart-bar';
    let hActive = Math.min((data.activeCalories / 1000) * 100, 100); if (hActive < 5) hActive = 5;
    barA.style.height = `${hActive}%`;
    chartCalActive.appendChild(barA);

    const barR = document.createElement('div'); barR.className = 'chart-bar';
    let hRest = Math.min((data.restCalories / 2500) * 100, 100); if (hRest < 5) hRest = 5;
    barR.style.height = `${hRest}%`;
    chartCalRest.appendChild(barR);
  }
}

function calculateAverages() {
  let totalSteps = 0, countSteps = 0;
  let totalActive = 0, countActive = 0;
  let totalRest = 0, countRest = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const data = appData.days[getDateKey(d)];
    if (data) {
      if (data.steps > 0) { totalSteps += data.steps; countSteps++; }
      if (data.activeCalories > 0) { totalActive += data.activeCalories; countActive++; }
      if (data.restCalories > 0) { totalRest += data.restCalories; countRest++; }
    }
  }

  const avgStepsEl = document.getElementById('avgSteps');
  const avgActiveEl = document.getElementById('avgActive');
  const avgRestEl = document.getElementById('avgRest');

  if (avgStepsEl) avgStepsEl.innerText = countSteps ? Math.round(totalSteps / countSteps) : 0;
  if (avgActiveEl) avgActiveEl.innerText = countActive ? Math.round(totalActive / countActive) : 0;
  if (avgRestEl) avgRestEl.innerText = countRest ? Math.round(totalRest / countRest) : 0;
}

function renderStatsMood() {
  const list = document.getElementById('statsMoodList');
  if (!list) return;
  list.innerHTML = '';
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const data = appData.days[getDateKey(d)];
    if (data && data.mood) {
      const span = document.createElement('span');
      span.innerText = data.mood;
      span.title = d.toLocaleDateString();
      list.appendChild(span);
    }
  }
  if (list.innerHTML === '') list.innerHTML = '<span style="font-size: 0.8rem; color:#888;">Нет записей</span>';
}

function renderStatsFoodHistory() {
  const container = document.getElementById('statsFoodHistory');
  if (!container) return;
  container.innerHTML = '';
  const allHistory = [];

  Object.keys(appData.days).forEach(dateKey => {
    if (appData.days[dateKey].foodHistory) {
      appData.days[dateKey].foodHistory.forEach(item => {
        allHistory.push({ date: dateKey, ...item });
      });
    }
  });

  allHistory.reverse().slice(0, 20).forEach(item => {
    const div = document.createElement('div');
    div.style.marginBottom = '5px';
    div.innerHTML = `<span style="color:#888">${item.date}:</span> <strong>${item.name}</strong> (${item.calories} ккал)`;
    container.appendChild(div);
  });
  if (container.innerHTML === '') container.innerHTML = '<p style="color:#888;">Нет данных о питании</p>';
}

function renderSleepCalendar() {
  const grid = document.getElementById('sleepCalendar');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const sleep = appData.days[getDateKey(d)] ? appData.days[getDateKey(d)].sleep : null;
    const div = document.createElement('div');
    div.className = 'sleep-day'; div.innerText = d.getDate();
    if (sleep !== null) {
      if (sleep < 6) div.classList.add('bad');
      else if (sleep >= 6 && sleep < 7) div.classList.add('mid');
      else div.classList.add('good');
      div.title = `${sleep} ч сна`;
    }
    grid.appendChild(div);
  }
}

// ================= ИИ-ЧАТ (АДАПТИРОВАННЫЙ ПОД NETLIFY) =================
function askAIPreset(question) {
  document.getElementById('aiChatInput').value = question;
  sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('aiChatInput');
  const text = input.value.trim();
  if (!text) return;

  if (aiLimitData.count >= DAILY_AI_LIMIT) {
    alert(`Достигнут дневной лимит (${DAILY_AI_LIMIT} сообщений). Приходи завтра!`);
    return;
  }

  input.value = '';
  const chatBox = document.getElementById('chatBox');

  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user'; userMsg.innerText = text;
  chatBox.appendChild(userMsg); chatBox.scrollTop = chatBox.scrollHeight;

  const botMsg = document.createElement('div');
  botMsg.className = 'chat-msg bot'; botMsg.innerText = "Анализирую данные... ⏳";
  chatBox.appendChild(botMsg); chatBox.scrollTop = chatBox.scrollHeight;

  aiLimitData.count++;
  localStorage.setItem(AI_LIMIT_KEY, JSON.stringify({ date: new Date().toDateString(), count: aiLimitData.count }));
  updateAILimitUI();

  const selectedKey = getDateKey(currentSelectedDate);
  const selectedData = appData.days[selectedKey] || { steps: 0, activeCalories: 0, restCalories: 0, food: 0, sleep: 0, weight: 0, mood: '', moodNote: '', foodHistory: [] };

  let foodList = "не записано";
  if (selectedData.foodHistory && selectedData.foodHistory.length > 0) {
    foodList = selectedData.foodHistory.map(item =>
      `${item.name} (${item.calories} ккал, Б:${item.protein || 0} Ж:${item.fat || 0} У:${item.carbs || 0})`
    ).join(', ');
  }

  const prompt = `
Мои данные за ${selectedKey}:
- Возраст: ${appData.profile.age || 'не указан'} лет
- Рост: ${appData.profile.height || 'не указан'} см
- Вес: ${appData.profile.weight || 'не указан'} кг
- Шаги: ${selectedData.steps || 0}
- Сожжено: ${selectedData.activeCalories || 0} ккал
- Покой: ${selectedData.restCalories || 0} ккал
- Съедено: ${selectedData.food || 0} ккал
- Сон: ${selectedData.sleep || 0} ч.
- Настроение: ${selectedData.mood || 'не указано'} ${selectedData.moodNote ? `(Заметка: ${selectedData.moodNote})` : ''}
- Что съел: ${foodList}

Мой вопрос: "${text}"
  `;

  try {
    // ВАЖНО: Запрос идет в облачную функцию Netlify, а не в локальный Python
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    });

    if (!response.ok) throw new Error('Ошибка сервера');

    const data = await response.json();

    // Выводим чистый текст ответа от ИИ
    botMsg.innerText = data.answer;

  } catch (error) {
    botMsg.innerText = "Ошибка ИИ. Проверь соединение с сервером.";
    console.error(error);
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}