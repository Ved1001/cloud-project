const API_BASE_URL = 'http://localhost:5000';

// DOM Elements
const authForm = document.getElementById('auth-form');
const toggleAuth = document.getElementById('toggle-auth');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const submitBtn = document.getElementById('submit-btn');
const toast = document.getElementById('toast');

let isLogin = true;

// Authentication UI Logic
if (toggleAuth) {
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        
        formTitle.innerText = isLogin ? 'CloudNotes' : 'Create Account';
        formSubtitle.innerText = isLogin ? 'Welcome back! Please enter your details.' : 'Join us today! Start organizing your thoughts.';
        submitBtn.innerText = isLogin ? 'Sign In' : 'Create Account';
        toggleAuth.innerHTML = isLogin ? 
            "Don't have an account? <strong>Create one for free</strong>" : 
            "Already have an account? <strong>Sign in here</strong>";
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        
        // Add loading state
        submitBtn.disabled = true;
        submitBtn.innerText = 'Processing...';
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (isLogin) {
                    localStorage.setItem('notes_token', data.token);
                    showToast('Login successful! Redirecting...', 'success');
                    setTimeout(() => window.location.href = 'dashboard.html', 800);
                } else {
                    showToast('Account created successfully! You can now login.', 'success');
                    // Automatically toggle to login
                    toggleAuth.click();
                    authForm.reset();
                }
            } else {
                showToast(data.error || 'Authentication failed', 'error');
            }
        } catch (error) {
            showToast('Gateway connection error. Is API Gateway running?', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = isLogin ? 'Sign In' : 'Create Account';
        }
    });
}

// Dashboard Logic
async function loadNotes() {
    const token = localStorage.getItem('notes_token');
    const notesGrid = document.getElementById('notes-grid');
    const notesCount = document.getElementById('notes-count');
    
    try {
        const response = await fetch(`${API_BASE_URL}/notes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('notes_token');
            window.location.href = 'login.html';
            return;
        }
        
        const notes = await response.json();
        notesGrid.innerHTML = '';
        notesCount.innerText = `${notes.length} Notes`;
        
        if (notes.length === 0) {
            notesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: white; border-radius: 24px; border: 2px dashed #e2e8f0;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                    <h3 style="color: var(--text-main);">No notes yet</h3>
                    <p style="color: var(--text-muted);">Your organized thoughts will appear here.</p>
                </div>
            `;
            return;
        }
        
        notes.forEach((note, index) => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.style.animationDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <button class="delete-btn" onclick="deleteNote(${note.id})" title="Delete Note">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <h3>${note.title}</h3>
                <p>${note.content.replace(/\n/g, '<br>')}</p>
            `;
            notesGrid.appendChild(card);
        });
    } catch (error) {
        showToast('Failed to fetch notes', 'error');
    }
}

const addNoteBtn = document.getElementById('add-note-btn');
if (addNoteBtn) {
    addNoteBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const token = localStorage.getItem('notes_token');
        
        if (!titleInput.value || !contentInput.value) {
            showToast('Please provide both title and content', 'error');
            return;
        }
        
        addNoteBtn.disabled = true;
        addNoteBtn.innerText = 'Saving...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/notes`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: titleInput.value, content: contentInput.value })
            });
            
            if (response.ok) {
                titleInput.value = '';
                contentInput.value = '';
                loadNotes();
                showToast('Note saved successfully!', 'success');
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to save note', 'error');
            }
        } catch (error) {
            showToast('Network error while saving note', 'error');
        } finally {
            addNoteBtn.disabled = false;
            addNoteBtn.innerText = 'Save Note';
        }
    });
}

async function deleteNote(id) {
    const token = localStorage.getItem('notes_token');
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            loadNotes();
            showToast('Note deleted', 'success');
        } else {
            showToast('Unauthorized or deletion failed', 'error');
        }
    } catch (error) {
        showToast('Error connecting to server', 'error');
    }
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('notes_token');
        showToast('Signed out successfully', 'success');
        setTimeout(() => window.location.href = 'login.html', 500);
    });
}

// Global Toast System
function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.innerText = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.className = `toast ${type}`;
    }, 3000);
}
