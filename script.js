// script.js - Phiên bản nâng cấp GIẢ LẬP SINH VIÊN cho 2N1

// ================ STATE MANAGEMENT ================
const AppState = {
    tasks: JSON.parse(localStorage.getItem('2n1_tasks')) || [],
    user: JSON.parse(localStorage.getItem('2n1_user')) || {
        name: "Người Dùng 2N1",
        dailyGoal: 8,
        theme: "light",
        major: null, // Chuyên ngành: IT, Law, Biz
        gpa: 0.0,
        exp: 0,
        level: "Tân sinh viên"
    },
    pomodoroSettings: JSON.parse(localStorage.getItem('2n1_pomodoro')) || {
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4
    },
    currentDate: new Date(),
    workSessionsCompleted: parseInt(localStorage.getItem('2n1_pomodoro_sessions')) || 0
};

// ================ DOM ELEMENTS ================
const elements = {
    timeSlotsContainer: document.getElementById('time-slots-container'),
    usernameElement: document.getElementById('username'),
    userInfo: document.getElementById('user-info'),
    completedCount: document.getElementById('completed-count'),
    totalCount: document.getElementById('total-count'),
    pomodoroCount: document.getElementById('pomodoro-count'),
    focusTime: document.getElementById('focus-time'),
    productivity: document.getElementById('productivity'),
    currentDateElement: document.getElementById('current-date'),
    timerDisplay: document.getElementById('timer'),
    sessionType: document.getElementById('session-type'),
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    resetBtn: document.getElementById('reset-btn'),
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    addTaskBtn: document.getElementById('add-task-btn'),
    changeDateBtn: document.getElementById('change-date-btn'),
    customizePomodoroBtn: document.getElementById('customize-pomodoro-btn'),
    editStatsBtn: document.getElementById('edit-stats-btn'),
    settingsLink: document.getElementById('settings-link'),
    modals: {}
};

// ================ GIẢ LẬP SINH VIÊN LOGIC ================

// Dữ liệu chuyên ngành dựa trên các môn bạn đang học
const MAJOR_DATA = {
    IT: { 
        name: "Kỹ sư Phần mềm", 
        tasks: ["Lập trình C (PRF192)", "Cấu trúc dữ liệu", "Debug mã nguồn Java", "Push code lên GitHub"],
        icon: "💻" 
    },
    Law: { 
        name: "Luật sư tương lai", 
        tasks: ["Phân tích Luật Thuế TNDN", "Nghiên cứu Luật GTGT", "Tóm tắt án lệ thương mại", "Soạn thảo hợp đồng"],
        icon: "⚖️" 
    },
    Biz: { 
        name: "Quản trị & Kinh tế", 
        tasks: ["Chạy dữ liệu SPSS", "Phân tích PESTLE quán café", "Nghiên cứu lạm phát", "Lập mô hình Canvas"],
        icon: "📈" 
    }
};

function openMajorModal() {
    const modalHtml = `
        <div id="major-modal" class="modal-overlay active">
            <div class="modal-content" style="text-align: center; max-width: 400px;">
                <h3 style="margin-bottom: 20px;">🎓 Chọn Chuyên Ngành Giả Lập</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn btn-primary" onclick="selectMajor('IT')">💻 Công nghệ thông tin</button>
                    <button class="btn btn-primary" onclick="selectMajor('Law')" style="background: #e67e22;">⚖️ Ngành Luật học</button>
                    <button class="btn btn-primary" onclick="selectMajor('Biz')" style="background: #27ae60;">📈 Kinh tế & Quản trị</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.selectMajor = function(id) {
    AppState.user.major = id;
    AppState.user.gpa = 2.0; // Bắt đầu với GPA trung bình
    saveToLocalStorage();
    
    // Đóng modal
    const modal = document.getElementById('major-modal');
    if(modal) modal.remove();
    
    // Gợi ý nhiệm vụ
    suggestMajorTasks(id);
    updateStats();
    showNotification(`Chào mừng bạn đến với chuyên ngành ${MAJOR_DATA[id].name}!`);
};

function suggestMajorTasks(id) {
    if(!id) return;
    const tasks = MAJOR_DATA[id].tasks;
    showNotification(`Gợi ý hôm nay: ${tasks[Math.floor(Math.random()*tasks.length)]}`, 'warning', 5000);
}

function updateStudentHUD() {
    const majorDisplay = document.getElementById('user-major');
    const gpaDisplay = document.getElementById('user-gpa');
    const lvDisplay = document.getElementById('user-level');
    
    if (AppState.user.major && majorDisplay) {
        majorDisplay.innerText = MAJOR_DATA[AppState.user.major].name;
        gpaDisplay.innerText = AppState.user.gpa.toFixed(2);
        lvDisplay.innerText = AppState.user.level;
    }
}

// ================ POMODORO & TASK UPDATES ================

function timerCompleted() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    playNotificationSound();
    
    if (isWorkSession) {
        AppState.workSessionsCompleted++;
        
        // CỘNG ĐIỂM GIẢ LẬP KHI XONG PHIÊN LÀM VIỆC
        if(AppState.user.major) {
            AppState.user.exp += 25;
            AppState.user.gpa = Math.min(4.0, AppState.user.gpa + 0.02); // Tăng nhẹ GPA
            checkLevelUp();
        }
        
        localStorage.setItem('2n1_pomodoro_sessions', AppState.workSessionsCompleted);
        elements.pomodoroCount.textContent = AppState.workSessionsCompleted;
        
        // Chuyển sang phiên nghỉ
        currentMinutes = (AppState.workSessionsCompleted % AppState.pomodoroSettings.sessionsBeforeLongBreak === 0) 
            ? AppState.pomodoroSettings.longBreakDuration : AppState.pomodoroSettings.breakDuration;
        elements.sessionType.textContent = "Đã đến giờ nghỉ ngơi!";
        isWorkSession = false;
    } else {
        currentMinutes = AppState.pomodoroSettings.workDuration;
        elements.sessionType.textContent = "Tập trung làm việc!";
        isWorkSession = true;
    }
    
    saveToLocalStorage();
    updateTimerDisplay();
    updateStats();
    elements.startBtn.disabled = false;
    showNotification(isWorkSession ? 'Quay lại học tập thôi!' : 'Nghỉ ngơi chút nào!');
}

function checkLevelUp() {
    const levels = ["Tân sinh viên", "Sinh viên năm 2", "Sinh viên năm 3", "Sinh viên năm cuối", "Thủ khoa đầu ra"];
    let newLvIndex = Math.floor(AppState.user.exp / 100);
    if (newLvIndex >= levels.length) newLvIndex = levels.length - 1;
    
    if (AppState.user.level !== levels[newLvIndex]) {
        AppState.user.level = levels[newLvIndex];
        showNotification(`CHÚC MỪNG! Bạn đã thăng cấp lên: ${AppState.user.level}`, 'success', 6000);
    }
}

// ================ (PHẦN CÒN LẠI GIỮ NGUYÊN TỪ CODE CŨ) ================

let timerInterval = null;
let isTimerRunning = false;
let isWorkSession = true;
let currentMinutes = AppState.pomodoroSettings.workDuration;
let currentSeconds = 0;

function formatTime(m, s) { return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; }
function updateTimerDisplay() { elements.timerDisplay.textContent = formatTime(currentMinutes, currentSeconds); }

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        elements.startBtn.disabled = true;
        elements.pauseBtn.disabled = false;
        timerInterval = setInterval(() => {
            if (currentSeconds === 0) {
                if (currentMinutes === 0) timerCompleted();
                else { currentMinutes--; currentSeconds = 59; }
            } else currentSeconds--;
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    elements.startBtn.innerHTML = '<i class="fas fa-play"></i> Tiếp Tục';
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    isWorkSession = true;
    currentMinutes = AppState.pomodoroSettings.workDuration;
    currentSeconds = 0;
    updateTimerDisplay();
    elements.startBtn.disabled = false;
}

// Logic thống kê & Task (Giữ nguyên từ bản của bạn)
function updateStats() {
    const todayTasks = AppState.tasks.filter(t => isSameDay(new Date(t.date || AppState.currentDate), AppState.currentDate));
    const completed = todayTasks.filter(t => t.completed).length;
    
    elements.completedCount.textContent = completed;
    elements.totalCount.textContent = todayTasks.length;
    elements.pomodoroCount.textContent = AppState.workSessionsCompleted;
    
    const prod = todayTasks.length > 0 ? Math.round((completed / todayTasks.length) * 100) : 0;
    elements.productivity.textContent = `${prod}%`;
    
    updateStudentHUD(); // Cập nhật HUD sinh viên
}

function isSameDay(d1, d2) {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

function saveToLocalStorage() {
    localStorage.setItem('2n1_tasks', JSON.stringify(AppState.tasks));
    localStorage.setItem('2n1_user', JSON.stringify(AppState.user));
    localStorage.setItem('2n1_pomodoro', JSON.stringify(AppState.pomodoroSettings));
}

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDateElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${AppState.currentDate.toLocaleDateString('vi-VN', options)}`;
    updateStats();
}

function showNotification(msg, type = 'success', dur = 3000) {
    elements.notificationMessage.textContent = msg;
    elements.notification.style.display = 'block';
    setTimeout(() => { elements.notification.style.display = 'none'; }, dur);
}

function playNotificationSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    osc.connect(context.destination);
    osc.start(); osc.stop(context.currentTime + 0.5);
}

// KHỞI TẠO
function init() {
    elements.usernameElement.textContent = AppState.user.name;
    updateDateDisplay();
    updateTimerDisplay();
    
    elements.startBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', pauseTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
    
    // Nếu chưa chọn ngành, nhắc chọn
    if (!AppState.user.major) {
        setTimeout(openMajorModal, 2000);
    } else {
        suggestMajorTasks(AppState.user.major);
    }
}

document.addEventListener('DOMContentLoaded', init);
