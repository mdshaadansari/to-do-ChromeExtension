
 
// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');

// Check for saved theme preference or use system preference
const savedTheme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
}

themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Task management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// DOM elements
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date');
const clearCompletedBtn = document.getElementById('clear-completed');
const clearAllBtn = document.getElementById('clear-all');
const filterButtons = document.querySelectorAll('.filter-btn');
const taskCount = document.getElementById('task-count');
const statsBtn = document.getElementById('stats-btn');
const statsModal = document.getElementById('stats-modal');
const closeStats = document.getElementById('close-stats');

// Set default due date to today
const today = new Date().toISOString().split('T')[0];
dueDateInput.value = today;
dueDateInput.min = today;

// Render tasks
function renderTasks(filter = 'all') {
    taskList.innerHTML = '';
    
    let filteredTasks = [...tasks];
    
    if (filter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (filter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    } else if (filter === 'today') {
        filteredTasks = tasks.filter(task => task.dueDate === today);
    }
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-tasks text-3xl mb-2"></i>
                <p>No ${filter === 'all' ? '' : filter + ' '}tasks found</p>
            </div>
        `;
        return;
    }
    
    filteredTasks.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm ${task.priority ? 'priority-' + task.priority : ''}`;
        taskItem.dataset.id = task.id;
        
        taskItem.innerHTML = `
            <div class="flex items-center flex-1">
                <input type="checkbox" ${task.completed ? 'checked' : ''} class="custom-checkbox mr-3">
                <div class="flex-1 ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}">
                    <div class="font-medium">${task.text}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        ${task.dueDate ? `<i class="fas fa-calendar-day mr-1"></i> ${formatDate(task.dueDate)}` : ''}
                        ${task.priority ? `<span class="ml-2 px-1.5 py-0.5 rounded text-xs ${getPriorityClass(task.priority)}">${task.priority}</span>` : ''}
                    </div>
                </div>
            </div>
            <button class="delete-btn ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        
        taskList.appendChild(taskItem);
        
        // Add event listeners to the new elements
        const checkbox = taskItem.querySelector('input[type="checkbox"]');
        const deleteBtn = taskItem.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
    });
    
    updateTaskCount();
}

// Format date for display
function formatDate(dateString) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Get priority class for styling
function getPriorityClass(priority) {
    switch(priority) {
        case 'high': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
        case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
        case 'low': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
        default: return '';
    }
}

// Add new task
function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return;
    
    const newTask = {
        id: Date.now().toString(),
        text,
        completed: false,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || null,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    taskInput.value = '';
    renderTasks(getActiveFilter());
}

// Toggle task completion status
function toggleTaskComplete(id) {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
    renderTasks(getActiveFilter());
}

// Delete task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks(getActiveFilter());
}

// Clear completed tasks
function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks(getActiveFilter());
}

// Clear all tasks
function clearAllTasks() {
    if (confirm('Are you sure you want to delete all tasks?')) {
        tasks = [];
        saveTasks();
        renderTasks(getActiveFilter());
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateTaskCount();
}

// Update task counter
function updateTaskCount() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const activeTasks = totalTasks - completedTasks;
    
    taskCount.textContent = `${activeTasks} ${activeTasks === 1 ? 'task' : 'tasks'} remaining`;
}

// Get active filter
function getActiveFilter() {
    const activeFilter = document.querySelector('.filter-btn.active');
    return activeFilter ? activeFilter.dataset.filter : 'all';
}

// Filter tasks
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        renderTasks(button.dataset.filter);
    });
});

// Show stats modal
function showStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;
    const dueTodayTasks = tasks.filter(task => task.dueDate === today).length;
    
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('pending-tasks').textContent = pendingTasks;
    document.getElementById('high-priority').textContent = highPriorityTasks;
    document.getElementById('due-today').textContent = dueTodayTasks;
    
    // Animate progress bars
    setTimeout(() => {
        document.getElementById('total-bar').style.width = '100%';
        document.getElementById('completed-bar').style.width = `${(completedTasks / totalTasks) * 100 || 0}%`;
        document.getElementById('pending-bar').style.width = `${(pendingTasks / totalTasks) * 100 || 0}%`;
    }, 100);
    
    statsModal.classList.remove('hidden');
}

// Close stats modal
function closeStatsModal() {
    statsModal.classList.add('hidden');
}

// Event listeners
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
clearCompletedBtn.addEventListener('click', clearCompletedTasks);
clearAllBtn.addEventListener('click', clearAllTasks);
statsBtn.addEventListener('click', showStats);
closeStats.addEventListener('click', closeStatsModal);
statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) closeStatsModal();
});

// Initial render
renderTasks();

// Chrome storage sync for extension data
chrome.storage.sync.get(['todoData'], function(result) {
    if (!result.todoData) {
        // Initialize with default data if none exists
        chrome.storage.sync.set({
            todoData: {
                tasks: [],
                settings: {
                    darkMode: savedTheme === 'dark',
                    defaultPriority: 'medium'
                }
            }
        });
    }
}); 