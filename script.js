/**
 * ==============================================================================
 * Daylight - 하루 계획 관리 & 24시간 맞춤 집중 타이머 with 치즈냥이
 * ==============================================================================
 */

// ==============================================================================
// 1. 상태(State) 관리 변수
// ==============================================================================

// (1) 할 일 관련 상태
let todos = []; // [{ id, text, completed }]

// (2) 타이머 관련 상태 (최대 24시간 = 86,400초 지원)
const MAX_TIMER_SECONDS = 24 * 3600;
let timerMode = 'custom';
let isTimerRunning = false;
let timerInterval = null;

let targetDurationSeconds = 3600;
let countdownSecondsLeft = targetDurationSeconds;
let stopwatchSeconds = 0;
let todayFocusSeconds = 0;

// (3) 치즈냥이 관련 상태
let catCurrentX = 40;
let catCurrentY = null;
let catFacing = 'right';
let catState = 'walking'; // 'walking', 'kneading', 'sleeping', 'picked', 'landing', 'pooping'
let catBehaviorTimer = null;

// 드래그 앤 드롭 제어 변수
let isDraggingCat = false;
let hasMovedCat = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastDragMouseX = 0;

// 💩 똥 관리 배열
let activePoops = []; // [{ id, element, timer, blinkTimer }]

const CAT_QUOTES = [
  '야옹~ 집사야 오늘도 응원한다냥! 🐾',
  '내 꾹꾹이를 받고 힘내라냥! 🐾',
  '목표 시간까지 집중해보자냥 ✨',
  '골골골... (기분 최고다냥)',
  '잠깐 기지개 켜고 물도 마시라냥 💧',
  '차근차근 해내면 다 할 수 있다냥! ☀️'
];

const CAT_PICKED_QUOTES = [
  '어... 어라?! 공중에 떴다냥! 🙀',
  '목덜미 잡혔다냥... 🐾',
  '어디로 데려가는 거냥? 🐱',
  '대롱대롱... 힘이 쏙 빠진다냥 🐾'
];

const CAT_CLEAN_QUOTES = [
  '집사야 깨끗하게 치워줘서 고맙다냥! ✨',
  '화장실 청소 최고다냥! 감동이다냥 🐾',
  '방이 다시 쾌적해졌다냥 🌿',
  '골골골... 역시 우리 집사다냥 💖'
];

// ==============================================================================
// 2. 주요 HTML 요소 참조
// ==============================================================================

// 날짜 및 할 일 요소
const currentDateEl = document.getElementById('current-date');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const inputWrapper = document.querySelector('.input-wrapper');
const inputErrorEl = document.getElementById('input-error');
const todoListEl = document.getElementById('todo-list');
const emptyStateEl = document.getElementById('empty-state');
const listBadgeEl = document.getElementById('list-badge');

// 달성률 통계 요소
const totalCountEl = document.getElementById('total-count');
const completedCountEl = document.getElementById('completed-count');
const remainingCountEl = document.getElementById('remaining-count');
const progressFillEl = document.getElementById('progress-fill');
const progressPercentageEl = document.getElementById('progress-percentage');
const encouragementTextEl = document.getElementById('encouragement-text');

// ⏱️ 타이머 요소
const timerCardEl = document.querySelector('.timer-card');
const timerDisplayEl = document.getElementById('timer-display');
const timerStatusTextEl = document.getElementById('timer-status-text');
const tabCustomBtn = document.getElementById('tab-custom');
const tabStopwatchBtn = document.getElementById('tab-stopwatch');
const customTimeSetterEl = document.getElementById('custom-time-setter');
const inputHoursEl = document.getElementById('input-hours');
const inputMinutesEl = document.getElementById('input-minutes');
const applyTimeBtn = document.getElementById('apply-time-btn');
const presetPills = document.querySelectorAll('.preset-pill');

const timerToggleBtn = document.getElementById('timer-toggle-btn');
const timerToggleTextEl = document.getElementById('timer-toggle-text');
const timerPlayIcon = document.getElementById('timer-play-icon');
const timerPauseIcon = document.getElementById('timer-pause-icon');
const timerResetBtn = document.getElementById('timer-reset-btn');
const totalFocusTimeEl = document.getElementById('total-focus-time');

// 🐱 치즈냥이 & 💩 똥 요소
const catContainer = document.getElementById('cheese-cat-container');
const catBody = document.getElementById('cat-body');
const catSpeech = document.getElementById('cat-speech');
const catSpeechText = document.getElementById('cat-speech-text');
const poopLayer = document.getElementById('poop-layer');

// ==============================================================================
// 3. 페이지 초기화
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  displayCurrentDate();
  initTodos();
  initTimerStorage();
  setupEventListeners();
  updateTimerDisplay();
  renderTotalFocusTime();
  initCheeseCat();
});

// ==============================================================================
// 4. 날짜 표시 함수
// ==============================================================================
function displayCurrentDate() {
  const today = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  };
  const formattedDate = new Intl.DateTimeFormat('ko-KR', options).format(today);
  currentDateEl.textContent = formattedDate;
}

// ==============================================================================
// 5. 할 일 데이터 관리 및 렌더링 (TodoList)
// ==============================================================================
function initTodos() {
  const isInitialized = localStorage.getItem('daylight_initialized');
  const storedTodos = localStorage.getItem('daylight_todos');

  if (!isInitialized) {
    todos = [
      { id: 'sample-1', text: 'Daylight 사용법 둘러보기 ☀️', completed: true },
      { id: 'sample-2', text: '오늘 꼭 끝내야 할 과제 정리하기 💻', completed: false },
      { id: 'sample-3', text: '치즈냥이 화장실 청소해주기 🐱', completed: false }
    ];
    saveTodos();
    localStorage.setItem('daylight_initialized', 'true');
  } else {
    if (storedTodos) {
      try {
        todos = JSON.parse(storedTodos);
      } catch (e) {
        console.error('데이터 파싱 오류:', e);
        todos = [];
      }
    } else {
      todos = [];
    }
  }

  render();
}

function saveTodos() {
  localStorage.setItem('daylight_todos', JSON.stringify(todos));
}

function render() {
  renderTodoList();
  updateProgressStats();
}

function renderTodoList() {
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    emptyStateEl.style.display = 'flex';
  } else {
    emptyStateEl.style.display = 'none';
    todos.forEach((todo) => {
      const li = createTodoElement(todo);
      todoListEl.appendChild(li);
    });
  }

  listBadgeEl.textContent = `${todos.length}개`;
}

function createTodoElement(todo) {
  const li = document.createElement('li');
  li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
  li.dataset.id = todo.id;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'todo-content';

  const checkbox = document.createElement('div');
  checkbox.className = 'custom-checkbox';
  checkbox.setAttribute('role', 'checkbox');
  checkbox.setAttribute('aria-checked', todo.completed);
  checkbox.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;

  const textSpan = document.createElement('span');
  textSpan.className = 'todo-text';
  textSpan.textContent = todo.text;

  contentDiv.appendChild(checkbox);
  contentDiv.appendChild(textSpan);

  contentDiv.addEventListener('click', () => {
    toggleTodo(todo.id);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.setAttribute('type', 'button');
  deleteBtn.setAttribute('aria-label', `"${todo.text}" 할 일 삭제`);
  deleteBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `;

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTodoWithAnimation(todo.id, li);
  });

  li.appendChild(contentDiv);
  li.appendChild(deleteBtn);

  return li;
}

function addTodo(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    showInputError('할 일 내용을 1글자 이상 입력해주세요!');
    return;
  }

  clearInputError();

  const newTodo = {
    id: 'todo-' + Date.now(),
    text: trimmedText,
    completed: false
  };

  todos.unshift(newTodo);
  saveTodos();
  render();

  todoInput.value = '';
  todoInput.focus();
}

function toggleTodo(id) {
  todos = todos.map(todo => {
    if (todo.id === id) {
      return { ...todo, completed: !todo.completed };
    }
    return todo;
  });

  saveTodos();
  render();
}

function deleteTodoWithAnimation(id, itemElement) {
  itemElement.classList.add('fade-out');
  setTimeout(() => {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    render();
  }, 220);
}

function updateProgressStats() {
  const total = todos.length;
  const completed = todos.filter(todo => todo.completed).length;
  const remaining = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  totalCountEl.textContent = total;
  completedCountEl.textContent = completed;
  remainingCountEl.textContent = remaining;
  progressPercentageEl.textContent = `${percentage}%`;

  progressFillEl.style.width = `${percentage}%`;
  const track = document.querySelector('.progress-track');
  if (track) {
    track.setAttribute('aria-valuenow', percentage);
  }

  updateEncouragementText(total, completed, percentage);
}

function updateEncouragementText(total, completed, percentage) {
  if (total === 0) {
    encouragementTextEl.textContent = '새로운 계획을 추가하고 기분 좋게 시작해봐요 🌿';
    return;
  }

  if (percentage === 0) {
    encouragementTextEl.textContent = '첫 걸음이 가장 중요해요! 하나씩 해내봐요 ✨';
  } else if (percentage < 50) {
    encouragementTextEl.textContent = '좋은 출발이에요! 차근차근 나아가고 있어요 ☕';
  } else if (percentage < 100) {
    encouragementTextEl.textContent = `벌써 ${percentage}% 달성! 조금만 더 힘내면 완주해요 🏃`;
  } else {
    encouragementTextEl.textContent = '완벽해요! 오늘 계획을 모두 달성했어요 🎉';
  }
}

function showInputError(message) {
  inputErrorEl.textContent = message;
  inputErrorEl.classList.add('visible');
  inputWrapper.classList.add('error');

  setTimeout(() => {
    inputWrapper.classList.remove('error');
  }, 400);

  todoInput.focus();
}

function clearInputError() {
  inputErrorEl.textContent = '';
  inputErrorEl.classList.remove('visible');
  inputWrapper.classList.remove('error');
}

// ==============================================================================
// ⏱️ 6. 24시간 맞춤형 집중 타이머
// ==============================================================================

function initTimerStorage() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem('daylight_focus_date');
  const savedSeconds = localStorage.getItem('daylight_focus_seconds');

  if (savedDate === todayKey && savedSeconds) {
    todayFocusSeconds = parseInt(savedSeconds, 10) || 0;
  } else {
    todayFocusSeconds = 0;
    localStorage.setItem('daylight_focus_date', todayKey);
    localStorage.setItem('daylight_focus_seconds', '0');
  }
}

function saveFocusTime() {
  const todayKey = new Date().toISOString().slice(0, 10);
  localStorage.setItem('daylight_focus_date', todayKey);
  localStorage.setItem('daylight_focus_seconds', todayFocusSeconds.toString());
  renderTotalFocusTime();
}

function renderTotalFocusTime() {
  if (todayFocusSeconds < 60) {
    totalFocusTimeEl.textContent = `${todayFocusSeconds}초`;
  } else {
    const hours = Math.floor(todayFocusSeconds / 3600);
    const minutes = Math.floor((todayFocusSeconds % 3600) / 60);

    if (hours > 0) {
      totalFocusTimeEl.textContent = `${hours}시간 ${minutes}분`;
    } else {
      totalFocusTimeEl.textContent = `${minutes}분`;
    }
  }
}

function formatSecondsToHHMMSS(totalSec) {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

function updateTimerDisplay() {
  const currentSec = timerMode === 'custom' ? countdownSecondsLeft : stopwatchSeconds;
  timerDisplayEl.textContent = formatSecondsToHHMMSS(currentSec);
}

function applyCustomTime(hours, mins) {
  pauseTimer();

  let h = parseInt(hours, 10) || 0;
  let m = parseInt(mins, 10) || 0;

  h = Math.max(0, Math.min(24, h));
  m = Math.max(0, Math.min(59, m));

  let totalSec = (h * 3600) + (m * 60);
  if (totalSec <= 0) totalSec = 60;
  if (totalSec > MAX_TIMER_SECONDS) totalSec = MAX_TIMER_SECONDS;

  targetDurationSeconds = totalSec;
  countdownSecondsLeft = totalSec;

  inputHoursEl.value = h;
  inputMinutesEl.value = m;

  timerStatusTextEl.textContent = `${h > 0 ? h + '시간 ' : ''}${m}분 집중 준비 완료! 🎯`;
  updateTimerDisplay();
}

function toggleTimer() {
  if (isTimerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (isTimerRunning) return;

  isTimerRunning = true;
  timerCardEl.classList.add('running');
  timerToggleBtn.classList.add('paused');
  timerToggleTextEl.textContent = '일시정지';
  timerPlayIcon.style.display = 'none';
  timerPauseIcon.style.display = 'block';

  if (timerMode === 'custom') {
    timerStatusTextEl.textContent = '열심히 목표를 향해 달리는 중 🔥';
  } else {
    timerStatusTextEl.textContent = '자유 공부 시간 측정 중 ⏱️';
  }

  showCatSpeech('집사야 집중 시간이다냥! 나도 얌전히 응원할게 🐾', 2500);

  timerInterval = setInterval(() => {
    if (timerMode === 'custom') {
      if (countdownSecondsLeft > 0) {
        countdownSecondsLeft--;
        todayFocusSeconds++;
        updateTimerDisplay();

        if (todayFocusSeconds % 10 === 0) saveFocusTime();

        if (countdownSecondsLeft === 0) {
          handleTargetComplete();
        }
      }
    } else {
      if (stopwatchSeconds < MAX_TIMER_SECONDS) {
        stopwatchSeconds++;
        todayFocusSeconds++;
        updateTimerDisplay();

        if (todayFocusSeconds % 10 === 0) saveFocusTime();
      }
    }
  }, 1000);
}

function pauseTimer() {
  if (!isTimerRunning) return;

  isTimerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;

  timerCardEl.classList.remove('running');
  timerToggleBtn.classList.remove('paused');
  timerToggleTextEl.textContent = '계속하기';
  timerPlayIcon.style.display = 'block';
  timerPauseIcon.style.display = 'none';
  timerStatusTextEl.textContent = '잠시 숨고르는 중 ☕';

  saveFocusTime();
}

function resetTimer() {
  pauseTimer();

  if (timerMode === 'custom') {
    countdownSecondsLeft = targetDurationSeconds;
  } else {
    stopwatchSeconds = 0;
  }

  timerToggleTextEl.textContent = '집중 시작';
  timerStatusTextEl.textContent = '준비 완료! 시작해볼까요? ✨';
  updateTimerDisplay();
  saveFocusTime();
}

function switchTimerMode(mode) {
  if (timerMode === mode) return;

  pauseTimer();
  timerMode = mode;

  if (mode === 'custom') {
    tabCustomBtn.classList.add('active');
    tabCustomBtn.setAttribute('aria-selected', 'true');
    tabStopwatchBtn.classList.remove('active');
    tabStopwatchBtn.setAttribute('aria-selected', 'false');

    customTimeSetterEl.style.display = 'flex';
    countdownSecondsLeft = targetDurationSeconds;
    timerStatusTextEl.textContent = '목표 시간을 정해보세요 🎯';
  } else {
    tabStopwatchBtn.classList.add('active');
    tabStopwatchBtn.setAttribute('aria-selected', 'true');
    tabCustomBtn.classList.remove('active');
    tabCustomBtn.setAttribute('aria-selected', 'false');

    customTimeSetterEl.style.display = 'none';
    stopwatchSeconds = 0;
    timerStatusTextEl.textContent = '원하는 만큼 자유롭게 측정해요 (최대 24시간) ⏱️';
  }

  timerToggleTextEl.textContent = '집중 시작';
  updateTimerDisplay();
}

function handleTargetComplete() {
  pauseTimer();
  countdownSecondsLeft = targetDurationSeconds;
  updateTimerDisplay();
  saveFocusTime();

  timerStatusTextEl.textContent = '목표 시간 달성 완료! 대단해요 🎉';
  playCelebrationSound();

  showCatSpeech('와아아! 목표 시간을 다 채웠다냥! 대단하다냥 🎉🐾', 4000);
}

function playCelebrationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.15);
      osc.stop(ctx.currentTime + idx * 0.15 + 0.4);
    });
  } catch (e) {}
}

// ==============================================================================
// 🐱 7. 치즈냥이 인공지능 & 드래그 & 배변(똥) 인터랙션
// ==============================================================================

function initCheeseCat() {
  catCurrentX = Math.floor(window.innerWidth * 0.15);
  updateCatPosition();

  startCatBehaviorTimer();
  setupCatDragEvents();
}

function startCatBehaviorTimer() {
  if (catBehaviorTimer) clearInterval(catBehaviorTimer);
  catBehaviorTimer = setInterval(() => {
    if (!isDraggingCat && catState !== 'pooping') {
      scheduleNextCatBehavior();
    }
  }, 10000);
}

function updateCatPosition() {
  catContainer.style.left = `${catCurrentX}px`;
  if (catCurrentY !== null) {
    catContainer.style.top = `${catCurrentY}px`;
    catContainer.style.bottom = 'auto';
  }
}

/**
 * 고양이의 다음 행동 결정 (산책, 꾹꾹이, 식빵, 💩배변)
 */
function scheduleNextCatBehavior() {
  const rand = Math.random();

  // 1) 배변 확률 (약 20% & 화면에 똥이 2개 미만일 때)
  if (rand < 0.22 && activePoops.length < 2) {
    triggerPoopSequence();
  } else if (rand < 0.55) {
    // 2) 산책
    setCatState('walking');
    moveCatToRandomSpot();
  } else if (rand < 0.82) {
    // 3) 꾹꾹이
    setCatState('kneading');
  } else {
    // 4) 식빵 굽기/잠자기
    setCatState('sleeping');
  }
}

function setCatState(newState) {
  catState = newState;
  catBody.className = `cat-character state-${newState} ${catFacing === 'left' ? 'facing-left' : ''}`;
}

function moveCatToRandomSpot() {
  const screenWidth = window.innerWidth;
  const minX = 30;
  const maxX = Math.max(screenWidth - 130, minX + 50);

  const targetX = Math.floor(Math.random() * (maxX - minX)) + minX;

  if (targetX < catCurrentX) {
    catFacing = 'left';
    catBody.classList.add('facing-left');
  } else {
    catFacing = 'right';
    catBody.classList.remove('facing-left');
  }

  catCurrentX = targetX;
  updateCatPosition();

  setTimeout(() => {
    if (catState === 'walking') {
      setCatState(Math.random() > 0.5 ? 'kneading' : 'sleeping');
    }
  }, 1800);
}

// ------------------------------------------------------------------------------
// 💩 고양이 배변(똥 싸기) 시퀀스
// ------------------------------------------------------------------------------
function triggerPoopSequence() {
  setCatState('pooping');
  showCatSpeech('끙... 끙차! 💩', 2000);

  // 1.8초간 힘주고 똥 생성
  setTimeout(() => {
    if (catState === 'pooping') {
      // 똥이 생성될 좌표 계산 (고양이 엉덩이 뒤쪽 바닥)
      const rect = catContainer.getBoundingClientRect();
      const poopX = catFacing === 'left' ? rect.right - 25 : rect.left + 5;
      const poopY = rect.bottom - 28;

      spawnPoopObject(poopX, poopY);

      // 배변 완료 후 홀가분하게 복귀
      showCatSpeech('시원하다냥! 🐾', 2200);
      setCatState(Math.random() > 0.5 ? 'kneading' : 'walking');
    }
  }, 1800);
}

/**
 * 💩 똥 오브젝트 생성 및 1분(60초) 자동 소멸 타이머 등록
 */
function spawnPoopObject(x, y) {
  const poopId = 'poop-' + Date.now();
  const poopEl = document.createElement('div');
  poopEl.className = 'poop-item';
  poopEl.id = poopId;
  poopEl.style.left = `${x}px`;
  poopEl.style.top = `${y}px`;

  // 귀여운 만화 똥 SVG & 모락모락 김
  poopEl.innerHTML = `
    <span class="poop-steam">♨</span>
    <svg viewBox="0 0 40 40" width="36" height="36">
      <!-- 똥 바닥 그림자 -->
      <ellipse cx="20" cy="36" rx="14" ry="3.5" fill="rgba(0,0,0,0.12)" />
      <!-- 소용돌이 만화 똥 -->
      <path d="M12 34 C8 34, 4 30, 8 26 C12 22, 28 22, 32 26 C36 30, 32 34, 28 34 Z" fill="#8D5B28" />
      <path d="M14 26 C11 26, 8 22, 12 18 C16 14, 24 14, 28 18 C32 22, 29 26, 26 26 Z" fill="#9C6630" />
      <path d="M17 18 C15 18, 14 14, 18 10 C22 6, 24 9, 21 14 C19 16, 19 18, 17 18 Z" fill="#B57B3F" />
      <!-- 꼭지점 -->
      <circle cx="21" cy="9" r="2.5" fill="#C68A48" />
      <!-- 눈망울 -->
      <circle cx="16" cy="27" r="1.6" fill="#2E241E" />
      <circle cx="24" cy="27" r="1.6" fill="#2E241E" />
      <circle cx="15.5" cy="26.3" r="0.6" fill="#FFFFFF" />
      <circle cx="23.5" cy="26.3" r="0.6" fill="#FFFFFF" />
      <!-- 핑크 볼터치 -->
      <circle cx="13" cy="29" r="1.2" fill="#FFA4A4" />
      <circle cx="27" cy="29" r="1.2" fill="#FFA4A4" />
    </svg>
  `;

  // 1) 클릭 이벤트: 즉시 깨끗하게 치우기
  poopEl.addEventListener('click', () => {
    cleanPoop(poopId, x, y);
  });

  poopLayer.appendChild(poopEl);

  // 2) 50초 후: 소멸 예고 깜빡임
  const blinkTimer = setTimeout(() => {
    poopEl.classList.add('expiring');
  }, 50000);

  // 3) 60초(1분) 후: 자연 소멸
  const removeTimer = setTimeout(() => {
    expirePoop(poopId);
  }, 60000);

  activePoops.push({
    id: poopId,
    element: poopEl,
    timer: removeTimer,
    blinkTimer: blinkTimer
  });
}

/**
 * 💩 사용자가 똥을 클릭해서 치웠을 때
 */
function cleanPoop(poopId, x, y) {
  const item = activePoops.find(p => p.id === poopId);
  if (!item) return;

  // 타이머 해제
  clearTimeout(item.timer);
  clearTimeout(item.blinkTimer);

  item.element.classList.add('cleaned');

  // 반짝이 파티클 폭죽 (✨, 🫧)
  spawnCleanSparkles(x + 18, y + 18);
  playCleanChimeSound();

  // 고양이 감동 말풍선
  const quote = CAT_CLEAN_QUOTES[Math.floor(Math.random() * CAT_CLEAN_QUOTES.length)];
  showCatSpeech(quote, 2800);

  // 350ms 후 DOM에서 완전 제거
  setTimeout(() => {
    item.element.remove();
    activePoops = activePoops.filter(p => p.id !== poopId);
  }, 350);
}

/**
 * 💩 1분 지나서 자연적으로 사라질 때
 */
function expirePoop(poopId) {
  const item = activePoops.find(p => p.id === poopId);
  if (!item) return;

  item.element.style.opacity = '0';
  setTimeout(() => {
    item.element.remove();
    activePoops = activePoops.filter(p => p.id !== poopId);
  }, 600);
}

/**
 * 청소 반짝이 파티클 이펙트
 */
function spawnCleanSparkles(cx, cy) {
  const emojis = ['✨', '🫧', '⭐', '✨'];
  const angles = [0, 90, 180, 270];

  angles.forEach((angle, idx) => {
    const rad = (angle * Math.PI) / 180;
    const dist = 32;
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist - 15;

    const sparkle = document.createElement('div');
    sparkle.className = 'clean-sparkle-particle';
    sparkle.textContent = emojis[idx % emojis.length];
    sparkle.style.left = `${cx}px`;
    sparkle.style.top = `${cy}px`;
    sparkle.style.setProperty('--tx', `${tx}px`);
    sparkle.style.setProperty('--ty', `${ty}px`);

    document.body.appendChild(sparkle);

    setTimeout(() => {
      sparkle.remove();
    }, 800);
  });
}

/**
 * 청소 완료 시 경쾌한 뾰롱~ 사운드
 */
function playCleanChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // 미
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // 높은 도

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.26);
  } catch (e) {}
}

// ------------------------------------------------------------------------------
// 🐾 고양이 마우스 / 터치 드래그 앤 드롭 구현
// ------------------------------------------------------------------------------
function setupCatDragEvents() {
  catContainer.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    startCatDrag(e.clientX, e.clientY);
  });

  catContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startCatDrag(touch.clientX, touch.clientY);
  }, { passive: false });

  window.addEventListener('mousemove', (e) => {
    if (!dragStartX && !isDraggingCat) return;
    moveCatDrag(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (!dragStartX && !isDraggingCat) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    moveCatDrag(touch.clientX, touch.clientY);
  }, { passive: false });

  window.addEventListener('mouseup', endCatDrag);
  window.addEventListener('touchend', endCatDrag);
}

function startCatDrag(clientX, clientY) {
  dragStartX = clientX;
  dragStartY = clientY;
  hasMovedCat = false;
  lastDragMouseX = clientX;

  const rect = catContainer.getBoundingClientRect();
  dragOffsetX = clientX - rect.left;
  dragOffsetY = clientY - rect.top;
}

function moveCatDrag(clientX, clientY) {
  const dist = Math.hypot(clientX - dragStartX, clientY - dragStartY);

  if (!isDraggingCat && dist > 5) {
    isDraggingCat = true;
    hasMovedCat = true;

    if (catBehaviorTimer) clearInterval(catBehaviorTimer);

    catContainer.classList.add('picked');
    setCatState('picked');

    const quote = CAT_PICKED_QUOTES[Math.floor(Math.random() * CAT_PICKED_QUOTES.length)];
    showCatSpeech(quote, 3000);
  }

  if (isDraggingCat) {
    if (clientX < lastDragMouseX - 2) {
      catFacing = 'left';
      catBody.classList.add('facing-left');
    } else if (clientX > lastDragMouseX + 2) {
      catFacing = 'right';
      catBody.classList.remove('facing-left');
    }
    lastDragMouseX = clientX;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const catW = 105;
    const catH = 80;

    let newX = clientX - dragOffsetX;
    let newY = clientY - dragOffsetY;

    newX = Math.max(10, Math.min(screenW - catW - 10, newX));
    newY = Math.max(10, Math.min(screenH - catH - 10, newY));

    catCurrentX = newX;
    catCurrentY = newY;
    updateCatPosition();
  }
}

function endCatDrag() {
  if (isDraggingCat) {
    isDraggingCat = false;
    catContainer.classList.remove('picked');

    setCatState('landing');
    showCatSpeech('안전하게 착지했다냥! 🐾', 2000);

    setTimeout(() => {
      setCatState(Math.random() > 0.5 ? 'kneading' : 'sleeping');
      startCatBehaviorTimer();
    }, 450);
  } else if (!hasMovedCat && dragStartX !== 0) {
    handleCatClick(dragStartX, dragStartY);
  }

  dragStartX = 0;
  dragStartY = 0;
}

function handleCatClick(x, y) {
  spawnHeartParticle(x, y);

  const quote = CAT_QUOTES[Math.floor(Math.random() * CAT_QUOTES.length)];
  showCatSpeech(quote, 2800);

  setCatState('kneading');
}

function showCatSpeech(text, duration = 2500) {
  catSpeechText.textContent = text;
  catSpeech.style.display = 'block';

  if (catSpeech._timeout) clearTimeout(catSpeech._timeout);
  catSpeech._timeout = setTimeout(() => {
    catSpeech.style.display = 'none';
  }, duration);
}

function spawnHeartParticle(x, y) {
  const heart = document.createElement('div');
  heart.className = 'cat-heart-particle';
  heart.textContent = '💖';
  heart.style.left = `${x - 10}px`;
  heart.style.top = `${y - 15}px`;

  document.body.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 900);
}

// ==============================================================================
// 8. 전체 이벤트 리스너 등록
// ==============================================================================
function setupEventListeners() {
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(todoInput.value);
  });

  todoInput.addEventListener('input', () => {
    if (inputErrorEl.classList.contains('visible')) {
      clearInputError();
    }
  });

  timerToggleBtn.addEventListener('click', toggleTimer);
  timerResetBtn.addEventListener('click', resetTimer);

  tabCustomBtn.addEventListener('click', () => switchTimerMode('custom'));
  tabStopwatchBtn.addEventListener('click', () => switchTimerMode('stopwatch'));

  applyTimeBtn.addEventListener('click', () => {
    applyCustomTime(inputHoursEl.value, inputMinutesEl.value);
  });

  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const h = pill.getAttribute('data-hours');
      const m = pill.getAttribute('data-mins');
      applyCustomTime(h, m);
    });
  });

  window.addEventListener('beforeunload', () => {
    saveFocusTime();
  });
}
