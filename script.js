// script.js - File JavaScript chính cho 2N1

// ================ STATE MANAGEMENT ================
const AppState = {
    // Tải dữ liệu từ localStorage hoặc dùng mặc định
    tasks: JSON.parse(localStorage.getItem('2n1_tasks')) || [],
    user: JSON.parse(localStorage.getItem('2n1_user')) || {
        name: "Người Dùng 2N1",
        dailyGoal: 8,
        workStart: "08:00",
        workEnd: "17:00",
        theme: "light"
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
    // Containers
    timeSlotsContainer: document.getElementById('time-slots-container'),
    mainContent: document.querySelector('.main-content'),
    
    // Buttons
    addTaskBtn: document.getElementById('add-task-btn'),
    changeDateBtn: document.getElementById('change-date-btn'),
    customizePomodoroBtn: document.getElementById('customize-pomodoro-btn'),
    editStatsBtn: document.getElementById('edit-stats-btn'),
    settingsLink: document.getElementById('settings-link'),
    
    // User info
    usernameElement: document.getElementById('username'),
    userInfo: document.getElementById('user-info'),
    
    // Stats
    completedCount: document.getElementById('completed-count'),
    totalCount: document.getElementById('total-count'),
    completedTasks: document.getElementById('completed-tasks'),
    pomodoroCount: document.getElementById('pomodoro-count'),
    focusTime: document.getElementById('focus-time'),
    productivity: document.getElementById('productivity'),
    currentDateElement: document.getElementById('current-date'),
    
    // Pomodoro
    timerDisplay: document.getElementById('timer'),
    sessionType: document.getElementById('session-type'),
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    resetBtn: document.getElementById('reset-btn'),
    
    // Notification
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    
    // Modals
    modals: {}
};

// ================ TIME SLOTS CONFIG ================
const TIME_SLOTS = [
    { 
        id: 'morning', 
        name: 'Sáng', 
        timeRange: '8:00 - 12:00', 
        color: '#4b6cb7',
        icon: 'fas fa-sun'
    },
    { 
        id: 'afternoon', 
        name: 'Chiều', 
        timeRange: '13:00 - 17:00', 
        color: '#6dd5ed',
        icon: 'fas fa-cloud-sun'
    },
    { 
        id: 'evening', 
        name: 'Tối', 
        timeRange: '19:00 - 21:00', 
        color: '#182848',
        icon: 'fas fa-moon'
    }
];

// ================ POMODORO TIMER ================
let timerInterval = null;
let isTimerRunning = false;
let isWorkSession = true;
let currentMinutes = AppState.pomodoroSettings.workDuration;
let currentSeconds = 0;

function formatTime(minutes, seconds) {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    elements.timerDisplay.textContent = formatTime(currentMinutes, currentSeconds);
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        elements.startBtn.disabled = true;
        elements.pauseBtn.disabled = false;
        
        timerInterval = setInterval(() => {
            if (currentSeconds === 0) {
                if (currentMinutes === 0) {
                    // Timer completed
                    timerCompleted();
                } else {
                    currentMinutes--;
                    currentSeconds = 59;
                }
            } else {
                currentSeconds--;
            }
            
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        elements.startBtn.innerHTML = '<i class="fas fa-play"></i> Tiếp Tục';
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    isWorkSession = true;
    currentMinutes = AppState.pomodoroSettings.workDuration;
    currentSeconds = 0;
    elements.sessionType.textContent = 'Sẵn sàng làm việc';
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    elements.startBtn.innerHTML = '<i class="fas fa-play"></i> Bắt Đầu';
    updateTimerDisplay();
}

function timerCompleted() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    
    // Play sound
    playNotificationSound();
    
    // Switch session
    if (isWorkSession) {
        AppState.workSessionsCompleted++;
        localStorage.setItem('2n1_pomodoro_sessions', AppState.workSessionsCompleted);
        elements.pomodoroCount.textContent = AppState.workSessionsCompleted;
        
        if (AppState.workSessionsCompleted % AppState.pomodoroSettings.sessionsBeforeLongBreak === 0) {
            currentMinutes = AppState.pomodoroSettings.longBreakDuration;
            elements.sessionType.textContent = `Nghỉ dài! Đã hoàn thành ${AppState.pomodoroSettings.sessionsBeforeLongBreak} phiên`;
            isWorkSession = false;
        } else {
            currentMinutes = AppState.pomodoroSettings.breakDuration;
            elements.sessionType.textContent = `Nghỉ ngắn! Thư giãn ${AppState.pomodoroSettings.breakDuration} phút`;
            isWorkSession = false;
        }
    } else {
        currentMinutes = AppState.pomodoroSettings.workDuration;
        elements.sessionType.textContent = `Làm việc! Tập trung ${AppState.pomodoroSettings.workDuration} phút`;
        isWorkSession = true;
    }
    
    updateTimerDisplay();
    elements.startBtn.disabled = false;
    elements.startBtn.innerHTML = '<i class="fas fa-play"></i> Tiếp Tục';
    
    showNotification(isWorkSession ? 
        'Thời gian nghỉ đã hết! Quay lại làm việc!' : 
        'Hoàn thành phiên làm việc! Hãy nghỉ ngơi!'
    );
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
        console.log('Không thể phát âm thanh:', e);
    }
}

// ================ TASK MANAGEMENT ================
function renderTasks() {
    elements.timeSlotsContainer.innerHTML = '';
    
    TIME_SLOTS.forEach(slot => {
        const slotTasks = AppState.tasks.filter(task => 
            task.time === slot.id && 
            isSameDay(new Date(task.date || AppState.currentDate), AppState.currentDate)
        );
        
        const completedCount = slotTasks.filter(task => task.completed).length;
        const totalCount = slotTasks.length;
        
        const timeSlotElement = document.createElement('div');
        timeSlotElement.className = 'time-slot';
        timeSlotElement.style.borderLeftColor = slot.color;
        
        timeSlotElement.innerHTML = `
            <div class="time-header">
                <div class="time-range">
                    <i class="${slot.icon}"></i>
                    ${slot.name} (${slot.timeRange})
                </div>
                <div class="task-count">${totalCount} nhiệm vụ</div>
            </div>
            <div id="tasks-${slot.id}">
                ${totalCount > 0 ? 
                    slotTasks.map(task => `
                        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                            <div class="task-name">${task.name}</div>
                            <div class="task-duration">${task.duration}</div>
                            <div class="task-actions">
                                <button class="task-action-btn edit-task-btn" title="Sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="task-action-btn delete-task-btn" title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('') : 
                    '<div class="empty-slot">Chưa có nhiệm vụ nào cho khung giờ này</div>'
                }
            </div>
        `;
        
        elements.timeSlotsContainer.appendChild(timeSlotElement);
    });
    
    // Attach event listeners
    attachTaskEventListeners();
    updateTaskCounts();
}

function attachTaskEventListeners() {
    // Checkbox events
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            const taskId = parseInt(this.closest('.task-item').dataset.id);
            const task = AppState.tasks.find(t => t.id === taskId);
            
            if (task) {
                task.completed = this.checked;
                this.closest('.task-item').classList.toggle('completed');
                updateStats();
                saveToLocalStorage();
                showNotification(`Đã ${task.completed ? 'hoàn thành' : 'bỏ hoàn thành'} nhiệm vụ: ${task.name}`);
            }
        });
    });
    
    // Edit button events
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const taskId = parseInt(this.closest('.task-item').dataset.id);
            openEditTaskModal(taskId);
        });
    });
    
    // Delete button events
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const taskId = parseInt(this.closest('.task-item').dataset.id);
            deleteTask(taskId);
        });
    });
    
    // Task item click events
    document.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.task-actions') && !e.target.classList.contains('task-checkbox')) {
                const taskId = parseInt(this.dataset.id);
                openTaskDetailModal(taskId);
            }
        });
    });
}

function addNewTask(taskData) {
    const newTask = {
        id: AppState.tasks.length > 0 ? Math.max(...AppState.tasks.map(t => t.id)) + 1 : 1,
        name: taskData.name,
        time: taskData.time,
        duration: formatDuration(taskData.duration),
        completed: false,
        priority: taskData.priority || 'medium',
        description: taskData.description || '',
        date: AppState.currentDate.toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };
    
    AppState.tasks.push(newTask);
    renderTasks();
    updateStats();
    saveToLocalStorage();
    showNotification('Đã thêm nhiệm vụ mới thành công!');
}

function updateTask(taskId, taskData) {
    const taskIndex = AppState.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        AppState.tasks[taskIndex] = {
            ...AppState.tasks[taskIndex],
            name: taskData.name,
            time: taskData.time,
            duration: formatDuration(taskData.duration),
            priority: taskData.priority || 'medium',
            description: taskData.description || ''
        };
        
        renderTasks();
        updateStats();
        saveToLocalStorage();
        showNotification('Đã cập nhật nhiệm vụ thành công!');
    }
}

function deleteTask(taskId) {
    if (confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
        AppState.tasks = AppState.tasks.filter(t => t.id !== taskId);
        renderTasks();
        updateStats();
        saveToLocalStorage();
        showNotification('Đã xóa nhiệm vụ thành công!');
    }
}

function formatDuration(durationValue) {
    if (durationValue === 'pomodoro') return '1 Pomodoro';
    if (durationValue === '2pomodoro') return '2 Pomodoro';
    
    const duration = parseInt(durationValue);
    if (duration < 60) return `${duration} phút`;
    if (duration === 60) return '1 giờ';
    return `${duration/60} giờ`;
}

function updateTaskCounts() {
    TIME_SLOTS.forEach(slot => {
        const slotTasks = AppState.tasks.filter(task => 
            task.time === slot.id && 
            isSameDay(new Date(task.date || AppState.currentDate), AppState.currentDate)
        );
        const taskCountElement = document.querySelector(`#tasks-${slot.id}`)?.closest('.time-slot')?.querySelector('.task-count');
        if (taskCountElement) {
            taskCountElement.textContent = `${slotTasks.length} nhiệm vụ`;
        }
    });
}

// ================ STATISTICS ================
function updateStats() {
    const todayTasks = AppState.tasks.filter(task => 
        isSameDay(new Date(task.date || AppState.currentDate), AppState.currentDate)
    );
    
    const totalTasks = todayTasks.length;
    const completedTasks = todayTasks.filter(task => task.completed).length;
    
    // Update task counts
    elements.completedCount.textContent = completedTasks;
    elements.totalCount.textContent = totalTasks;
    elements.completedTasks.textContent = completedTasks;
    
    // Update Pomodoro count
    elements.pomodoroCount.textContent = AppState.workSessionsCompleted;
    
    // Calculate focus time
    let focusMinutes = 0;
    todayTasks.forEach(task => {
        if (task.completed) {
            if (task.duration.includes('phút')) {
                focusMinutes += parseInt(task.duration);
            } else if (task.duration.includes('giờ')) {
                focusMinutes += parseInt(task.duration) * 60;
            } else if (task.duration.includes('Pomodoro')) {
                const pomodoroCount = parseInt(task.duration);
                focusMinutes += pomodoroCount * 25;
            }
        }
    });
    
    const hours = Math.floor(focusMinutes / 60);
    const minutes = focusMinutes % 60;
    elements.focusTime.textContent = `${hours}h ${minutes}m`;
    
    // Calculate productivity
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    elements.productivity.textContent = `${productivity}%`;
}

// ================ DATE MANAGEMENT ================
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = AppState.currentDate.toLocaleDateString('vi-VN', options);
    elements.currentDateElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${dateString}`;
    
    // Re-render tasks for the new date
    renderTasks();
    updateStats();
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

// ================ MODAL MANAGEMENT ================
function createModal(modalId, title, content, onClose = null) {
    // Remove existing modal if any
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="close-modal" id="close-${modalId}">&times;</button>
                </div>
                ${content}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(`close-${modalId}`);
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        if (onClose) onClose();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            if (onClose) onClose();
        }
    });
    
    elements.modals[modalId] = modal;
    return modal;
}

function openAddTaskModal() {
    const formHtml = `
        <form id="add-task-form">
            <div class="form-group">
                <label class="form-label" for="task-name">Tên nhiệm vụ *</label>
                <input type="text" class="form-input" id="task-name" placeholder="Nhập tên nhiệm vụ" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="task-time">Thời gian *</label>
                    <select class="form-select" id="task-time" required>
                        <option value="">Chọn khung giờ</option>
                        <option value="morning">Sáng (8:00 - 12:00)</option>
                        <option value="afternoon">Chiều (13:00 - 17:00)</option>
                        <option value="evening">Tối (19:00 - 21:00)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="task-duration">Thời lượng *</label>
                    <select class="form-select" id="task-duration" required>
                        <option value="">Chọn thời lượng</option>
                        <option value="15">15 phút</option>
                        <option value="30">30 phút</option>
                        <option value="45">45 phút</option>
                        <option value="60">1 giờ</option>
                        <option value="90">1.5 giờ</option>
                        <option value="120">2 giờ</option>
                        <option value="pomodoro">1 Pomodoro (25 phút)</option>
                        <option value="2pomodoro">2 Pomodoro (50 phút)</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="task-priority">Mức độ ưu tiên</label>
                <select class="form-select" id="task-priority">
                    <option value="low">Thấp</option>
                    <option value="medium" selected>Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="task-description">Mô tả (tùy chọn)</label>
                <textarea class="form-textarea" id="task-description" placeholder="Mô tả chi tiết nhiệm vụ..."></textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn secondary-btn" id="cancel-add-task">Hủy</button>
                <button type="submit" class="btn btn-primary">Thêm Nhiệm Vụ</button>
            </div>
        </form>
    `;
    
    const modal = createModal('add-task-modal', '<i class="fas fa-plus-circle"></i> Thêm Nhiệm Vụ Mới', formHtml);
    
    // Form submission
    document.getElementById('add-task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const taskData = {
            name: document.getElementById('task-name').value,
            time: document.getElementById('task-time').value,
            duration: document.getElementById('task-duration').value,
            priority: document.getElementById('task-priority').value,
            description: document.getElementById('task-description').value
        };
        
        addNewTask(taskData);
        modal.classList.remove('active');
    });
    
    // Cancel button
    document.getElementById('cancel-add-task').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.classList.add('active');
}

function openEditTaskModal(taskId) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Extract duration value from display string
    let durationValue = '30';
    if (task.duration.includes('Pomodoro')) {
        durationValue = task.duration.includes('2') ? '2pomodoro' : 'pomodoro';
    } else if (task.duration.includes('giờ')) {
        durationValue = (parseFloat(task.duration) * 60).toString();
    } else {
        durationValue = task.duration.replace(' phút', '');
    }
    
    const formHtml = `
        <form id="edit-task-form">
            <div class="form-group">
                <label class="form-label" for="edit-task-name">Tên nhiệm vụ *</label>
                <input type="text" class="form-input" id="edit-task-name" value="${task.name}" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="edit-task-time">Thời gian *</label>
                    <select class="form-select" id="edit-task-time" required>
                        <option value="morning" ${task.time === 'morning' ? 'selected' : ''}>Sáng (8:00 - 12:00)</option>
                        <option value="afternoon" ${task.time === 'afternoon' ? 'selected' : ''}>Chiều (13:00 - 17:00)</option>
                        <option value="evening" ${task.time === 'evening' ? 'selected' : ''}>Tối (19:00 - 21:00)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="edit-task-duration">Thời lượng *</label>
                    <select class="form-select" id="edit-task-duration" required>
                        <option value="15" ${durationValue === '15' ? 'selected' : ''}>15 phút</option>
                        <option value="30" ${durationValue === '30' ? 'selected' : ''}>30 phút</option>
                        <option value="45" ${durationValue === '45' ? 'selected' : ''}>45 phút</option>
                        <option value="60" ${durationValue === '60' ? 'selected' : ''}>1 giờ</option>
                        <option value="90" ${durationValue === '90' ? 'selected' : ''}>1.5 giờ</option>
                        <option value="120" ${durationValue === '120' ? 'selected' : ''}>2 giờ</option>
                        <option value="pomodoro" ${durationValue === 'pomodoro' ? 'selected' : ''}>1 Pomodoro (25 phút)</option>
                        <option value="2pomodoro" ${durationValue === '2pomodoro' ? 'selected' : ''}>2 Pomodoro (50 phút)</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="edit-task-priority">Mức độ ưu tiên</label>
                <select class="form-select" id="edit-task-priority">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Thấp</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Trung bình</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Cao</option>
                    <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Khẩn cấp</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="edit-task-description">Mô tả</label>
                <textarea class="form-textarea" id="edit-task-description">${task.description || ''}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn secondary-btn" id="cancel-edit-task">Hủy</button>
                <button type="submit" class="btn btn-primary">Cập Nhật</button>
            </div>
        </form>
    `;
    
    const modal = createModal('edit-task-modal', '<i class="fas fa-edit"></i> Chỉnh Sửa Nhiệm Vụ', formHtml);
    
    // Form submission
    document.getElementById('edit-task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const taskData = {
            name: document.getElementById('edit-task-name').value,
            time: document.getElementById('edit-task-time').value,
            duration: document.getElementById('edit-task-duration').value,
            priority: document.getElementById('edit-task-priority').value,
            description: document.getElementById('edit-task-description').value
        };
        
        updateTask(taskId, taskData);
        modal.classList.remove('active');
    });
    
    // Cancel button
    document.getElementById('cancel-edit-task').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.classList.add('active');
}

function openTaskDetailModal(taskId) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const priorityColors = {
        low: '#28a745',
        medium: '#ffc107',
        high: '#fd7e14',
        urgent: '#dc3545'
    };
    
    const priorityText = {
        low: 'Thấp',
        medium: 'Trung bình',
        high: 'Cao',
        urgent: 'Khẩn cấp'
    };
    
    const timeSlotText = {
        morning: 'Sáng (8:00 - 12:00)',
        afternoon: 'Chiều (13:00 - 17:00)',
        evening: 'Tối (19:00 - 21:00)'
    };
    
    const contentHtml = `
        <div class="task-detail">
            <div class="detail-row">
                <strong>Tên nhiệm vụ:</strong>
                <span>${task.name}</span>
            </div>
            <div class="detail-row">
                <strong>Trạng thái:</strong>
                <span class="status-badge ${task.completed ? 'completed' : 'pending'}">
                    ${task.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                </span>
            </div>
            <div class="detail-row">
                <strong>Khung giờ:</strong>
                <span>${timeSlotText[task.time]}</span>
            </div>
            <div class="detail-row">
                <strong>Thời lượng:</strong>
                <span>${task.duration}</span>
            </div>
            <div class="detail-row">
                <strong>Mức độ ưu tiên:</strong>
                <span class="priority-badge" style="background-color: ${priorityColors[task.priority] || '#6c757d'}">
                    ${priorityText[task.priority] || task.priority}
                </span>
            </div>
            ${task.description ? `
                <div class="detail-row">
                    <strong>Mô tả:</strong>
                    <p>${task.description}</p>
                </div>
            ` : ''}
            <div class="detail-row">
                <strong>Ngày tạo:</strong>
                <span>${new Date(task.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn secondary-btn" id="close-task-detail">Đóng</button>
            <button type="button" class="btn btn-primary" id="edit-from-detail">Chỉnh Sửa</button>
        </div>
    `;
    
    const modal = createModal('task-detail-modal', '<i class="fas fa-info-circle"></i> Chi Tiết Nhiệm Vụ', contentHtml);
    
    // Close button
    document.getElementById('close-task-detail').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Edit button
    document.getElementById('edit-from-detail').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => openEditTaskModal(taskId), 300);
    });
    
    modal.classList.add('active');
}

function openUserSettingsModal() {
    const formHtml = `
        <form id="user-settings-form">
            <div class="form-group">
                <label class="form-label" for="user-name">Tên người dùng *</label>
                <input type="text" class="form-input" id="user-name" value="${AppState.user.name}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="daily-goal">Mục tiêu hàng ngày (số nhiệm vụ)</label>
                <input type="number" class="form-input" id="daily-goal" value="${AppState.user.dailyGoal}" min="1" max="20">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="work-start">Giờ bắt đầu làm việc</label>
                    <input type="time" class="form-input" id="work-start" value="${AppState.user.workStart}">
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="work-end">Giờ kết thúc làm việc</label>
                    <input type="time" class="form-input" id="work-end" value="${AppState.user.workEnd}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="theme">Giao diện</label>
                <select class="form-select" id="theme">
                    <option value="light" ${AppState.user.theme === 'light' ? 'selected' : ''}>Sáng</option>
                    <option value="dark" ${AppState.user.theme === 'dark' ? 'selected' : ''}>Tối</option>
                </select>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn secondary-btn" id="cancel-user-settings">Hủy</button>
                <button type="submit" class="btn btn-primary">Lưu Cài Đặt</button>
            </div>
        </form>
    `;
    
    const modal = createModal('user-settings-modal', '<i class="fas fa-user-cog"></i> Cài Đặt Người Dùng', formHtml);
    
    // Form submission
    document.getElementById('user-settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        AppState.user.name = document.getElementById('user-name').value;
        AppState.user.dailyGoal = parseInt(document.getElementById('daily-goal').value) || 8;
        AppState.user.workStart = document.getElementById('work-start').value;
        AppState.user.workEnd = document.getElementById('work-end').value;
        AppState.user.theme = document.getElementById('theme').value;
        
        elements.usernameElement.textContent = AppState.user.name;
        saveToLocalStorage();
        applyTheme();
        modal.classList.remove('active');
        showNotification('Đã cập nhật cài đặt thành công!');
    });
    
    // Cancel button
    document.getElementById('cancel-user-settings').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.classList.add('active');
}

function openPomodoroSettingsModal() {
    const formHtml = `
        <form id="pomodoro-settings-form">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="work-duration">Thời gian làm việc (phút)</label>
                    <input type="number" class="form-input" id="work-duration" 
                           value="${AppState.pomodoroSettings.workDuration}" min="5" max="60" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="break-duration">Thời gian nghỉ ngắn (phút)</label>
                    <input type="number" class="form-input" id="break-duration" 
                           value="${AppState.pomodoroSettings.breakDuration}" min="1" max="15" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="long-break-duration">Thời gian nghỉ dài (phút)</label>
                <input type="number" class="form-input" id="long-break-duration" 
                       value="${AppState.pomodoroSettings.longBreakDuration}" min="10" max="30" required>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="sessions-before-long-break">Số phiên trước nghỉ dài</label>
                <input type="number" class="form-input" id="sessions-before-long-break" 
                       value="${AppState.pomodoroSettings.sessionsBeforeLongBreak}" min="2" max="8" required>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn secondary-btn" id="cancel-pomodoro-settings">Hủy</button>
                <button type="submit" class="btn btn-primary">Lưu Cài Đặt</button>
            </div>
        </form>
    `;
    
    const modal = createModal('pomodoro-settings-modal', '<i class="fas fa-sliders-h"></i> Cài Đặt Pomodoro', formHtml);
    
    // Form submission
    document.getElementById('pomodoro-settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        AppState.pomodoroSettings.workDuration = parseInt(document.getElementById('work-duration').value);
        AppState.pomodoroSettings.breakDuration = parseInt(document.getElementById('break-duration').value);
        AppState.pomodoroSettings.longBreakDuration = parseInt(document.getElementById('long-break-duration').value);
        AppState.pomodoroSettings.sessionsBeforeLongBreak = parseInt(document.getElementById('sessions-before-long-break').value);
        
        saveToLocalStorage();
        resetTimer(); // Reset với cài đặt mới
        modal.classList.remove('active');
        showNotification('Đã cập nhật cài đặt Pomodoro thành công!');
    });
    
    // Cancel button
    document.getElementById('cancel-pomodoro-settings').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.classList.add('active');
}

// ================ NOTIFICATION SYSTEM ================
function showNotification(message, type = 'success', duration = 3000) {
    elements.notificationMessage.textContent = message;
    
    // Set notification type
    elements.notification.className = 'notification';
    if (type === 'error') {
        elements.notification.classList.add('error');
        elements.notification.querySelector('h4').innerHTML = '<i class="fas fa-exclamation-circle"></i> Lỗi!';
    } else if (type === 'warning') {
        elements.notification.classList.add('warning');
        elements.notification.querySelector('h4').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Cảnh báo!';
    } else {
        elements.notification.querySelector('h4').innerHTML = '<i class="fas fa-check-circle"></i> Thành công!';
    }
    
    // Show notification
    elements.notification.style.display = 'block';
    elements.notification.style.animation = 'slideIn 0.5s ease-out';
    
    // Hide after duration
    setTimeout(() => {
        elements.notification.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => {
            elements.notification.style.display = 'none';
        }, 500);
    }, duration);
}

// ================ LOCAL STORAGE ================
function saveToLocalStorage() {
    localStorage.setItem('2n1_tasks', JSON.stringify(AppState.tasks));
    localStorage.setItem('2n1_user', JSON.stringify(AppState.user));
    localStorage.setItem('2n1_pomodoro', JSON.stringify(AppState.pomodoroSettings));
}

// ================ THEME MANAGEMENT ================
function applyTheme() {
    if (AppState.user.theme === 'dark') {
        document.documentElement.style.setProperty('--primary-color', '#6c8ce6');
        document.documentElement.style.setProperty('--secondary-color', '#1a2b5c');
        document.documentElement.style.setProperty('--accent-color', '#4dc9e6');
        document.documentElement.style.setProperty('--light-color', '#2d3748');
        document.documentElement.style.setProperty('--dark-color', '#1a202c');
        document.documentElement.style.setProperty('--text-color', '#e2e8f0');
        document.body.style.background = 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)';
        document.body.style.color = '#e2e8f0';
    } else {
        // Reset to light theme
        document.documentElement.style.setProperty('--primary-color', '#4b6cb7');
        document.documentElement.style.setProperty('--secondary-color', '#182848');
        document.documentElement.style.setProperty('--accent-color', '#6dd5ed');
        document.documentElement.style.setProperty('--light-color', '#f8f9fa');
        document.documentElement.style.setProperty('--dark-color', '#343a40');
        document.documentElement.style.setProperty('--text-color', '#333');
        document.body.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
        document.body.style.color = '#333';
    }
}

// ================ EVENT LISTENERS ================
function setupEventListeners() {
    // Add task button
    elements.addTaskBtn.addEventListener('click', openAddTaskModal);
    
    // Change date button
    elements.changeDateBtn.addEventListener('click', () => {
        const newDateStr = prompt('Nhập ngày mới (định dạng: dd/mm/yyyy):', 
            `${AppState.currentDate.getDate()}/${AppState.currentDate.getMonth() + 1}/${AppState.currentDate.getFullYear()}`);
        
        if (newDateStr) {
            const parts = newDateStr.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);
                
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    AppState.currentDate = new Date(year, month, day);
                    updateDateDisplay();
                    showNotification('Đã thay đổi ngày hiển thị!');
                } else {
                    showNotification('Định dạng ngày không hợp lệ!', 'error');
                }
            } else {
                showNotification('Định dạng ngày không hợp lệ!', 'error');
            }
        }
    });
    
    // Customize Pomodoro button
    elements.customizePomodoroBtn.addEventListener('click', openPomodoroSettingsModal);
    
    // Edit stats button
    elements.editStatsBtn.addEventListener('click', () => {
        const newCompleted = prompt('Nhập số nhiệm vụ đã hoàn thành:', elements.completedTasks.textContent);
        
        if (newCompleted !== null && !isNaN(newCompleted) && newCompleted >= 0) {
            elements.completedTasks.textContent = newCompleted;
            elements.completedCount.textContent = newCompleted;
            
            // Recalculate productivity
            const totalTasks = parseInt(elements.totalCount.textContent);
            const productivity = totalTasks > 0 ? Math.round((parseInt(newCompleted) / totalTasks) * 100) : 0;
            elements.productivity.textContent = `${productivity}%`;
            
            showNotification('Đã cập nhật thống kê thủ công!');
        }
    });
    
    // User info click
    elements.userInfo.addEventListener('click', openUserSettingsModal);
    
    // Settings link
    elements.settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        openUserSettingsModal();
    });
    
    // Pomodoro timer controls
    elements.startBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', pauseTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N to add new task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openAddTaskModal();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            Object.values(elements.modals).forEach(modal => {
                if (modal.classList.contains('active')) {
                    modal.classList.remove('active');
                }
            });
        }
        
        // Space to control Pomodoro timer
        if (e.key === ' ' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            if (isTimerRunning) {
                pauseTimer();
            } else {
                startTimer();
            }
        }
    });
}

// ================ INITIALIZATION ================
function init() {
    // Apply theme
    applyTheme();
    
    // Set user name
    elements.usernameElement.textContent = AppState.user.name;
    
    // Update date display
    updateDateDisplay();
    
    // Update stats
    updateStats();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial timer display
    updateTimerDisplay();
    
    // Show welcome message
    setTimeout(() => {
        showNotification(`Chào mừng đến với 2N1, ${AppState.user.name}! Hãy bắt đầu quản lý thời gian của bạn.`);
    }, 1000);
}

// ================ START APPLICATION ================
document.addEventListener('DOMContentLoaded', init);
