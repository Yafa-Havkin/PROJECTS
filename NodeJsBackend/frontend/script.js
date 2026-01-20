class AssignmentManager {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        this.user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.showSection(target);
            }
        });

        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('assignmentForm')?.addEventListener('submit', (e) => this.handleCreateAssignment(e));
        document.getElementById('submissionForm')?.addEventListener('submit', (e) => this.handleSubmission(e));

        // Role selection
        document.getElementById('role').addEventListener('change', (e) => {
            const teacherCodeGroup = document.getElementById('teacherCodeGroup');
            if (e.target.value === '1') {
                teacherCodeGroup.classList.remove('hidden');
            } else {
                teacherCodeGroup.classList.add('hidden');
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // About info on cat icon click
        document.querySelector('.nav-brand').addEventListener('click', () => this.showInfoModal());
        
        // Close modal
        document.getElementById('closeModal').addEventListener('click', () => this.hideInfoModal());
        
        // Close modal on outside click
        document.getElementById('infoModal').addEventListener('click', (e) => {
            if (e.target.id === 'infoModal') {
                this.hideInfoModal();
            }
        });
        
        // Password toggle functionality
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const targetId = toggle.getAttribute('data-target');
                const input = document.getElementById(targetId);
                
                if (input.type === 'password') {
                    input.type = 'text';
                    toggle.classList.remove('fa-eye');
                    toggle.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    toggle.classList.remove('fa-eye-slash');
                    toggle.classList.add('fa-eye');
                }
            });
        });
    }

    checkAuth() {
        if (this.token && this.user.userId) {
            this.showDashboard();
        } else {
            this.showSection('login');
        }
    }

    showSection(sectionId) {
        document.querySelectorAll('.auth-section, .dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Add loading animation
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = `<span class="btn-text">${originalText}</span>`;
        console.log('Login button classes:', submitBtn.className); // Debug log
        
        const data = {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value
        };

        console.log('Login data:', data); // Debug log

        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.text();
            console.log('Login response:', result); // Debug log
            
            if (response.ok) {
                const parsedResult = JSON.parse(result);
                this.token = parsedResult.token;
                
                // Show loading overlay
                this.showLoadingOverlay();
                
                // Decode user info from token
                const tokenPayload = JSON.parse(atob(this.token.split('.')[1]));
                this.user = {
                    userId: tokenPayload.userId,
                    role: tokenPayload.role,
                    name: data.email.split('@')[0], // Use email prefix as name temporarily
                    email: data.email
                };
                
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                // Wait for animation then show dashboard
                setTimeout(() => {
                    this.hideLoadingOverlay();
                    this.showNotification('התחברת בהצלחה!', 'success');
                    this.showDashboard();
                }, 2000);
            } else {
                this.showNotification(result || 'שגיאה בהתחברות', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('שגיאה בחיבור לשרת', 'error');
        } finally {
            // Remove loading animation
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Add loading animation
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = `<span class="btn-text">${originalText}</span>`;
        
        const data = {
            userId: document.getElementById('userId').value,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: parseInt(document.getElementById('role').value)
        };

        if (data.role === 1) {
            data.teacherCode = document.getElementById('teacherCode').value;
        }

        console.log('Sending data:', data); // Debug log

        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.text();
            console.log('Server response:', result); // Debug log
            
            if (response.ok) {
                this.showNotification('נרשמת בהצלחה! אנא התחבר', 'success');
                this.showSection('login');
                document.getElementById('registerForm').reset();
            } else {
                this.showNotification(result || 'שגיאה בהרשמה', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('שגיאה בחיבור לשרת', 'error');
        } finally {
            // Remove loading animation
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
        }
    }

    showDashboard() {
        this.showSection('dashboard');
        document.getElementById('dashboardLink').classList.remove('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
        
        document.getElementById('welcomeMessage').textContent = `ברוך הבא, ${this.user.name}!`;
        document.getElementById('userInfo').textContent = `${this.user.role === 1 ? 'מורה' : 'תלמיד'} | ${this.user.email}`;

        if (this.user.role === 1) {
            document.getElementById('teacherDashboard').classList.remove('hidden');
            this.loadTeacherData();
        } else {
            document.getElementById('studentDashboard').classList.remove('hidden');
            this.loadStudentData();
        }
    }

    async loadTeacherData() {
        await this.loadAssignments();
        await this.loadSubmissions();
    }

    async loadStudentData() {
        await this.loadOpenAssignments();
        await this.loadMySubmissions();
        await this.populateAssignmentSelect();
    }

    async loadAssignments() {
        try {
            const response = await fetch(`${this.baseURL}/teacher/assignments`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const assignments = await response.json();
                this.displayAssignments(assignments);
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
        }
    }

    async loadSubmissions() {
        console.log('Loading submissions...'); // Debug log
        try {
            const response = await fetch(`${this.baseURL}/teacher/submissions`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            console.log('Submissions response status:', response.status); // Debug log
            
            if (response.ok) {
                const submissions = await response.json();
                console.log('Submissions loaded:', submissions); // Debug log
                this.displaySubmissions(submissions);
            } else {
                console.log('Failed to load submissions:', response.statusText); // Debug log
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
        }
    }

    async loadOpenAssignments() {
        try {
            const response = await fetch(`${this.baseURL}/student/assignments`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const assignments = await response.json();
                console.log('Open assignments:', assignments); // Debug log
                // Added for frontend support - extract array from response object
                const assignmentsArray = assignments['Your open assignments'] || assignments.assignments || assignments;
                if (Array.isArray(assignmentsArray)) {
                    this.displayOpenAssignments(assignmentsArray);
                } else {
                    console.log('Assignments is not an array:', assignments);
                    this.displayOpenAssignments([]);
                }
            }
        } catch (error) {
            console.error('Error loading open assignments:', error);
        }
    }

    async loadMySubmissions() {
        try {
            const response = await fetch(`${this.baseURL}/student/submissions/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const submissions = await response.json();
                console.log('My submissions:', submissions); // Debug log
                // Added for frontend support - extract array from response object
                const submissionsArray = submissions['Your submissions'] || submissions.submissions || submissions;
                if (Array.isArray(submissionsArray)) {
                    this.displayMySubmissions(submissionsArray);
                } else {
                    console.log('Submissions is not an array:', submissions);
                    this.displayMySubmissions([]);
                }
            }
        } catch (error) {
            console.error('Error loading my submissions:', error);
        }
    }

    async populateAssignmentSelect() {
        try {
            const response = await fetch(`${this.baseURL}/student/assignments`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const assignments = await response.json();
                console.log('Assignment select data:', assignments); // Debug log
                const select = document.getElementById('submissionAssignment');
                select.innerHTML = '<option value="">בחר מטלה</option>';
                // Added for frontend support - extract array from response object
                const assignmentsArray = assignments['Your open assignments'] || assignments.assignments || assignments;
                console.log('Assignments array for select:', assignmentsArray); // Debug log
                if (Array.isArray(assignmentsArray) && assignmentsArray.length > 0) {
                    assignmentsArray.forEach(assignment => {
                        console.log('Adding assignment to select:', assignment); // Debug log
                        console.log('Assignment ID:', assignment._id); // Debug log
                        console.log('Assignment keys:', Object.keys(assignment)); // Debug log
                        
                        const option = document.createElement('option');
                        // Try different possible ID fields
                        const assignmentId = assignment._id || assignment.id || assignment.__v;
                        option.value = assignmentId;
                        option.textContent = assignment.title;
                        
                        console.log('Option value set to:', option.value); // Debug log
                        select.appendChild(option);
                    });
                    console.log('Select options after adding:', select.options.length); // Debug log
                } else {
                    console.log('No assignments to add to select');
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'אין מטלות זמינות';
                    select.appendChild(option);
                }
            }
        } catch (error) {
            console.error('Error populating assignment select:', error);
        }
    }

    displayAssignments(assignments) {
        const container = document.getElementById('assignmentsList');
        container.innerHTML = '';
        
        assignments.forEach(assignment => {
            const div = document.createElement('div');
            div.className = 'assignment-item';
            div.innerHTML = `
                <div class="assignment-title">${assignment.title}</div>
                <div class="assignment-description">${assignment.description}</div>
                <div class="assignment-deadline">תאריך הגשה: ${new Date(assignment.deadline).toLocaleDateString('he-IL')}</div>
            `;
            container.appendChild(div);
        });
    }

    displaySubmissions(submissions) {
        const container = document.getElementById('submissionsList');
        container.innerHTML = '';
        
        console.log('Submissions data:', submissions); // Debug log
        
        submissions.forEach(submission => {
            console.log('Single submission:', submission); // Debug log
            
            const div = document.createElement('div');
            div.className = 'submission-item';
            
            // Added for frontend support - safe access to nested properties and convert to string
            const studentId = submission.studentId?._id || submission.studentId;
            const assignmentId = submission.assignmentId?._id || submission.assignmentId?.id || submission.assignmentId;
            
            console.log('Raw IDs:', { studentId, assignmentId }); // Debug log
            console.log('Assignment object:', submission.assignmentId); // Debug log
            
            // Ensure IDs are strings, not objects
            let studentIdStr = studentId;
            let assignmentIdStr = assignmentId;
            
            if (typeof studentId === 'object' && studentId !== null) {
                studentIdStr = studentId._id || studentId.id || studentId.toString();
            }
            if (typeof assignmentId === 'object' && assignmentId !== null) {
                assignmentIdStr = assignmentId._id || assignmentId.id || assignmentId.toString();
            }
            
            console.log('Final IDs:', { studentIdStr, assignmentIdStr }); // Debug log
            
            const studentName = submission.studentId?.name || submission.studentId || 'לא ידוע';
            const assignmentTitle = submission.assignmentId?.title || 'לא ידוע';
            
            div.innerHTML = `
                <div class="submission-title">מטלה: ${assignmentTitle}</div>
                <div class="submission-description">תלמיד: ${studentName}</div>
                ${submission.partnerId ? `<div class="submission-description">פרטנר: ${submission.partnerId}</div>` : ''}
                <div class="submission-description">קישור: <a href="${submission.githubLink}" target="_blank">${submission.githubLink}</a></div>
                <div class="submission-status">ציון: ${submission.grade || 'לא הוערך'}</div>
                ${!submission.grade && studentIdStr && assignmentIdStr ? `
                    <div class="grade-form">
                        <input type="number" min="0" max="100" placeholder="ציון" id="grade-${submission._id}">
                        <input type="text" placeholder="משוב" id="feedback-${submission._id}">
                        <button onclick="app.gradeSubmission('${submission._id}', '${studentIdStr}', '${assignmentIdStr}')">הערך</button>
                    </div>
                ` : ''}
            `;
            container.appendChild(div);
        });
    }

    displayOpenAssignments(assignments) {
        const container = document.getElementById('openAssignments');
        container.innerHTML = '';
        
        assignments.forEach(assignment => {
            const div = document.createElement('div');
            div.className = 'assignment-item';
            div.innerHTML = `
                <div class="assignment-title">${assignment.title}</div>
                <div class="assignment-description">${assignment.description}</div>
                <div class="assignment-deadline">תאריך הגשה: ${new Date(assignment.deadline).toLocaleDateString('he-IL')}</div>
            `;
            container.appendChild(div);
        });
    }

    displayMySubmissions(submissions) {
        const container = document.getElementById('mySubmissions');
        container.innerHTML = '';
        
        submissions.forEach(submission => {
            const div = document.createElement('div');
            div.className = 'submission-item';
            div.innerHTML = `
                <div class="submission-title">מטלה: ${submission.assignmentId?.title || 'לא ידוע'}</div>
                <div class="submission-description">קישור: <a href="${submission.githubLink}" target="_blank">${submission.githubLink}</a></div>
                ${submission.partnerId ? `<div class="submission-description">פרטנר: ${submission.partnerId}</div>` : ''}
                <div class="submission-status">ציון: ${submission.grade || 'ממתין להערכה'}</div>
                ${submission.feedback ? `<div class="submission-description">משוב: ${submission.feedback}</div>` : ''}
            `;
            container.appendChild(div);
        });
    }

    async handleCreateAssignment(e) {
        e.preventDefault();
        const data = {
            title: document.getElementById('assignmentTitle').value,
            description: document.getElementById('assignmentDescription').value,
            deadline: document.getElementById('assignmentDeadline').value
        };

        try {
            const response = await fetch(`${this.baseURL}/teacher/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showNotification('מטלה נוצרה בהצלחה!', 'success');
                document.getElementById('assignmentForm').reset();
                this.loadAssignments();
            } else {
                this.showNotification('שגיאה ביצירת המטלה', 'error');
            }
        } catch (error) {
            this.showNotification('שגיאה בחיבור לשרת', 'error');
        }
    }

    async handleSubmission(e) {
        e.preventDefault();
        
        const assignmentSelect = document.getElementById('submissionAssignment');
        const githubInput = document.getElementById('githubLink');
        const partnerInput = document.getElementById('partnerId');
        
        console.log('Form elements:', { assignmentSelect, githubInput, partnerInput }); // Debug log
        console.log('Selected assignment:', assignmentSelect.value); // Debug log
        console.log('GitHub link:', githubInput.value); // Debug log
        console.log('Partner ID:', partnerInput.value); // Debug log
        
        const data = {
            assignmentId: assignmentSelect.value,
            githubLink: githubInput.value
        };
        
        // Add partnerId only if it's not empty
        if (partnerInput.value.trim()) {
            data.partnerId = partnerInput.value.trim();
        }

        console.log('Submission data:', data); // Debug log

        // Validate data before sending
        if (!data.assignmentId) {
            this.showNotification('אנא בחר מטלה', 'error');
            return;
        }
        if (!data.githubLink) {
            this.showNotification('אנא הכנס קישור GitHub', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/student/submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.text();
            console.log('Submission response:', result); // Debug log

            if (response.ok) {
                this.showSubmissionSuccess();
                document.getElementById('submissionForm').reset();
                this.loadMySubmissions();
            } else {
                this.showNotification(result || 'שגיאה בהגשת המטלה', 'error');
            }
        } catch (error) {
            console.error('Submission error:', error);
            this.showNotification('שגיאה בחיבור לשרת', 'error');
        }
    }

    async gradeSubmission(submissionId, studentId, assignmentId) {
        const grade = document.getElementById(`grade-${submissionId}`).value;
        const feedback = document.getElementById(`feedback-${submissionId}`).value;

        try {
            const response = await fetch(`${this.baseURL}/teacher/${studentId}/${assignmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ grade: parseInt(grade), feedback })
            });

            if (response.ok) {
                this.showNotification('ציון נשמר בהצלחה!', 'success');
                this.loadSubmissions();
            } else {
                this.showNotification('שגיאה בשמירת הציון', 'error');
            }
        } catch (error) {
            this.showNotification('שגיאה בחיבור לשרת', 'error');
        }
    }

    logout() {
        const logoutBtn = document.getElementById('logoutBtn');
        const originalText = logoutBtn.textContent;
        
        // Add loading animation
        logoutBtn.classList.add('loading');
        logoutBtn.innerHTML = `<span class="btn-text">${originalText}</span>`;
        
        // Show loading overlay with logout text
        this.showLoadingOverlay();
        document.querySelector('.loading-text').textContent = 'מתנתק מהמערכת';
        
        // Simulate logout delay for animation
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.token = null;
            this.user = {};
            // Clear forms and input fields to avoid showing previous user data
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            if (loginForm) loginForm.reset();
            if (registerForm) registerForm.reset();
            const idsToClear = ['loginEmail','loginPassword','userId','name','email','password','teacherCode','assignmentTitle','assignmentDescription','assignmentDeadline','githubLink','partnerId'];
            idsToClear.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    try { el.value = ''; } catch (e) {}
                }
            });
            document.getElementById('dashboardLink').classList.add('hidden');
            document.getElementById('logoutBtn').classList.add('hidden');
            document.getElementById('teacherDashboard').classList.add('hidden');
            document.getElementById('studentDashboard').classList.add('hidden');
            
            // Remove loading animation
            logoutBtn.classList.remove('loading');
            logoutBtn.textContent = originalText;
            
            // Hide loading overlay and reset text
            this.hideLoadingOverlay();
            document.querySelector('.loading-text').textContent = 'טוען את המערכת';
            
            this.showSection('login');
            this.showNotification('התנתקת בהצלחה', 'success');
        }, 2000);
    }

    showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('show');
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('show');
    }
    
    showAboutInfo() {
        const aboutMessage = `
🎓 מערכת ניהול מטלות - Assignment Manager

👨‍🏫 למורים:
• יצירת מטלות חדשות
• צפייה בהגשות התלמידים
• מתן ציונים ומשוב

👨‍🎓 לתלמידים:
• צפייה במטלות פתוחות
• הגשת מטלות עם קישור GitHub
• אפשרות להוסיף פרטנר
• צפייה בציונים והמשוב

💻 פותח על ידי: לאה'לה ויפי
🚀 טכנולוגיות: Node.js, MongoDB, Express
        `;
        
        alert(aboutMessage);
    }
}

// Initialize the app
const app = new AssignmentManager();

// Add submission success animation function
AssignmentManager.prototype.showSubmissionSuccess = function() {
    const overlay = document.getElementById('loadingOverlay');
    const catElement = overlay.querySelector('.loading-cat');
    const textElement = overlay.querySelector('.loading-text');
    
    // Change cat to spinning version
    catElement.className = 'spinning-cat';
    catElement.innerHTML = `
        <div class="cat-eyes">
            <div class="cat-eye"></div>
            <div class="cat-eye"></div>
        </div>
        <div class="cat-nose"></div>
        <div class="cat-mouth"></div>
    `;
    
    // Change text
    textElement.textContent = 'מטלה הוגשה בהצלחה!';
    
    // Show overlay
    overlay.classList.add('show');
    
    // Hide after 3 seconds and reset
    setTimeout(() => {
        overlay.classList.remove('show');
        // Reset to original loading cat
        catElement.className = 'loading-cat';
        catElement.innerHTML = `
            <div class="cat-eyes">
                <div class="cat-eye"></div>
                <div class="cat-eye"></div>
            </div>
            <div class="cat-nose"></div>
            <div class="cat-mouth"></div>
        `;
        textElement.textContent = 'טוען את המערכת';
    }, 3000);
};

// Add info modal functions
AssignmentManager.prototype.showInfoModal = function() {
    document.getElementById('infoModal').classList.remove('hidden');
};

AssignmentManager.prototype.hideInfoModal = function() {
    document.getElementById('infoModal').classList.add('hidden');
};