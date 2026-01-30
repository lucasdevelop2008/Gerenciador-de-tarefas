document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const authScreen = document.getElementById('auth-screen');
    const loginCard = document.getElementById('login-card');
    const signupCard = document.getElementById('signup-card');
    const appContainer = document.getElementById('app-container');

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    const goToSignup = document.getElementById('go-to-signup');
    const goToLogin = document.getElementById('go-to-login');

    const userNameDisplay = document.getElementById('user-name-display');
    const userEmailDisplay = document.getElementById('user-email-display');
    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Estado da Aplicação ---
    let users = JSON.parse(localStorage.getItem('tm_users')) || [];
    let currentUser = JSON.parse(localStorage.getItem('tm_current_user')) || null;
    let tasks = JSON.parse(localStorage.getItem('tm_tasks')) || [];

    // --- Inicialização ---
    function init() {
        if (currentUser) {
            showApp();
        } else {
            showAuth('login');
        }
        updateDate();
    }

    function updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateEl = document.getElementById('current-date');
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('pt-BR', options);
    }

    // --- Alternar Telas de Autenticação ---
    goToSignup.onclick = (e) => { e.preventDefault(); showAuth('signup'); };
    goToLogin.onclick = (e) => { e.preventDefault(); showAuth('login'); };

    function showAuth(type) {
        authScreen.classList.remove('hidden');
        appContainer.classList.add('hidden');
        if (type === 'login') {
            loginCard.classList.remove('hidden');
            signupCard.classList.add('hidden');
        } else {
            loginCard.classList.add('hidden');
            signupCard.classList.remove('hidden');
        }
    }

    // --- Lógica de Cadastro ---
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;

        signupError.classList.add('hidden');

        if (password !== confirm) {
            showError(signupError, 'As senhas não coincidem!');
            return;
        }
        if (password.length < 6) {
            showError(signupError, 'A senha deve ter pelo menos 6 caracteres!');
            return;
        }
        if (users.find(u => u.email === email)) {
            showError(signupError, 'Este e-mail já está cadastrado!');
            return;
        }

        const newUser = { id: Date.now(), name, email, password };
        users.push(newUser);
        localStorage.setItem('tm_users', JSON.stringify(users));
        
        // Login automático após cadastro
        loginUser(newUser);
    });

    // --- Lógica de Login ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        loginError.classList.add('hidden');

        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            loginUser(user);
        } else {
            showError(loginError, 'E-mail ou senha incorretos!');
        }
    });

    function loginUser(user) {
        currentUser = user;
        localStorage.setItem('tm_current_user', JSON.stringify(user));
        showApp();
    }

    logoutBtn.onclick = () => {
        localStorage.removeItem('tm_current_user');
        currentUser = null;
        showAuth('login');
    };

    function showError(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
    }

    function showApp() {
        authScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userNameDisplay.textContent = currentUser.name;
        userEmailDisplay.textContent = currentUser.email;
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        renderAll();
    }

    // --- Gerenciamento de Tarefas ---
    const taskForm = document.getElementById('task-form');
    const taskModal = document.getElementById('task-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.querySelector('.close-modal');

    openModalBtn.onclick = () => taskModal.classList.remove('hidden');
    closeModalBtn.onclick = () => taskModal.classList.add('hidden');

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const priority = document.getElementById('task-priority').value;

        const newTask = {
            id: Date.now(),
            userId: currentUser.id,
            title,
            priority,
            completed: false
        };

        tasks.unshift(newTask);
        localStorage.setItem('tm_tasks', JSON.stringify(tasks));
        renderAll();
        taskForm.reset();
        taskModal.classList.add('hidden');
    });

    // --- Renderização ---
    function renderAll() {
        const userTasks = tasks.filter(t => t.userId === currentUser.id);
        renderDashboard(userTasks);
        renderTasksList(userTasks);
    }

    function renderDashboard(userTasks) {
        const completed = userTasks.filter(t => t.completed).length;
        const pending = userTasks.length - completed;
        const percent = userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0;

        document.getElementById('stat-total').textContent = userTasks.length;
        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-completed').textContent = completed;
        
        const progressBar = document.getElementById('main-progress-bar');
        progressBar.style.width = `${percent}%`;
        document.getElementById('progress-text').textContent = `${percent}% concluído`;

        const recentList = document.getElementById('recent-list');
        recentList.innerHTML = '';
        userTasks.slice(0, 3).forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `<div class="task-content ${task.completed ? 'completed' : ''}">${task.title}</div>`;
            recentList.appendChild(li);
        });
    }

    let currentFilter = 'all';
    function renderTasksList(userTasks) {
        const list = document.getElementById('full-task-list');
        list.innerHTML = '';
        
        let filtered = userTasks;
        if (currentFilter === 'pending') filtered = userTasks.filter(t => !t.completed);
        if (currentFilter === 'completed') filtered = userTasks.filter(t => t.completed);

        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content ${task.completed ? 'completed' : ''}">
                    <strong>${task.title}</strong>
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                </div>
                <button class="btn-delete"><i class="fas fa-trash"></i></button>
            `;

            li.querySelector('.task-checkbox').onchange = () => {
                const t = tasks.find(item => item.id === task.id);
                t.completed = !t.completed;
                localStorage.setItem('tm_tasks', JSON.stringify(tasks));
                renderAll();
            };

            li.querySelector('.btn-delete').onclick = () => {
                tasks = tasks.filter(item => item.id !== task.id);
                localStorage.setItem('tm_tasks', JSON.stringify(tasks));
                renderAll();
            };

            list.appendChild(li);
        });
    }

    // Filtros e Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const view = item.getAttribute('data-view');
            document.querySelectorAll('.view').forEach(v => v.id === `view-${view}` ? v.classList.remove('hidden') : v.classList.add('hidden'));
        };
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderAll();
        };
    });

    init();
});
