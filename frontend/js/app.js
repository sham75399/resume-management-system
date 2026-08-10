// API Configuration
const API_URL = 'http://localhost:5000/api';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update welcome message if on protected page
    const welcomeUser = document.getElementById('welcomeUser');
    if (welcomeUser) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            welcomeUser.textContent = `Welcome, ${user.name}`;
        }
    }

    // Load page-specific data
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboard();
    }
    
    if (window.location.pathname.includes('applicants.html')) {
        loadApplicants();
    }
    
    if (window.location.pathname.includes('applicant-form.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
            document.getElementById('formTitle').textContent = 'Edit Applicant';
            loadApplicant(id);
        }
    }

    // Setup form handlers
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const applicantForm = document.getElementById('applicantForm');
    if (applicantForm) {
        applicantForm.addEventListener('submit', handleApplicantSubmit);
    }
});

// Login Handler - UPDATED VERSION
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');
    
    // Clear any existing session data first
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear error display
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    try {
        console.log('Attempting login with:', { email }); // Debug log
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Login response:', data); // Debug log

        if (response.ok) {
            // Store new session data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            
            // Verify storage worked
            console.log('Token stored:', localStorage.getItem('token') ? 'Yes' : 'No');
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            errorDiv.style.display = 'block';
            errorDiv.textContent = data.message || 'Login failed';
            
            // Clear any partial data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Connection error. Make sure backend is running.';
        
        // Clear any partial data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

// Register Handler
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            successDiv.style.display = 'block';
            successDiv.textContent = 'Registration successful! Redirecting to login...';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            errorDiv.style.display = 'block';
            errorDiv.textContent = data.message || 'Registration failed';
        }
    } catch (error) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Connection error. Make sure backend is running.';
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_URL}/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Update stats
            document.getElementById('totalApplicants').textContent = data.totalApplicants;
            
            // Add status stats
            const statsContainer = document.getElementById('statsContainer');
            // Clear existing stat cards except the first one (total)
            while (statsContainer.children.length > 1) {
                statsContainer.removeChild(statsContainer.lastChild);
            }
            
            Object.entries(data.statusCounts).forEach(([status, count]) => {
                const statCard = document.createElement('div');
                statCard.className = 'stat-card';
                statCard.innerHTML = `
                    <h3>${status}</h3>
                    <div class="stat-number">${count}</div>
                `;
                statsContainer.appendChild(statCard);
            });

            // Update recent applicants
            const tbody = document.getElementById('recentApplicants');
            tbody.innerHTML = '';
            
            // Get current user role
            const user = JSON.parse(localStorage.getItem('user'));
            
            data.recentApplicants.forEach(applicant => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${applicant.firstName} ${applicant.lastName}</td>
                    <td><span class="badge badge-${applicant.status.toLowerCase()}">${applicant.status}</span></td>
                    <td>${new Date(applicant.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button onclick="editApplicant('${applicant._id}')" class="btn btn-primary">View</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load Applicants
async function loadApplicants() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_URL}/applicants`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const applicants = await response.json();
        displayApplicants(applicants);
    } catch (error) {
        console.error('Error loading applicants:', error);
    }
}

// Display Applicants with Role-Based Actions
function displayApplicants(applicants) {
    const tbody = document.getElementById('applicantsList');
    tbody.innerHTML = '';

    if (applicants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No applicants found</td></tr>';
        return;
    }

    // Get current user role
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user && user.role === 'admin';

    applicants.forEach(applicant => {
        // Build action buttons based on role
        let actionButtons = `
            <button onclick="editApplicant('${applicant._id}')" class="btn btn-primary">Edit</button>
            <button onclick="downloadResume('${applicant._id}')" class="btn">Download</button>
        `;
        
        // Only admins can delete
        if (isAdmin) {
            actionButtons += `<button onclick="deleteApplicant('${applicant._id}')" class="btn btn-danger">Delete</button>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${applicant.firstName} ${applicant.lastName}</td>
            <td>${applicant.email}</td>
            <td>${applicant.skills?.join(', ') || '-'}</td>
            <td>${applicant.experience} years</td>
            <td><span class="badge badge-${applicant.status.toLowerCase()}">${applicant.status}</span></td>
            <td>${actionButtons}</td>
        `;
        tbody.appendChild(row);
    });
}

// Apply Filters
async function applyFilters() {
    const name = document.getElementById('filterName').value;
    const skills = document.getElementById('filterSkills').value;
    const status = document.getElementById('filterStatus').value;

    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (skills) params.append('skills', skills);
    if (status) params.append('status', status);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/applicants?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const applicants = await response.json();
        displayApplicants(applicants);
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

// Clear Filters
function clearFilters() {
    document.getElementById('filterName').value = '';
    document.getElementById('filterSkills').value = '';
    document.getElementById('filterStatus').value = '';
    loadApplicants();
}

// Load Single Applicant for Editing
async function loadApplicant(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/applicants/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const applicant = await response.json();

        document.getElementById('firstName').value = applicant.firstName;
        document.getElementById('lastName').value = applicant.lastName;
        document.getElementById('email').value = applicant.email;
        document.getElementById('phone').value = applicant.phone;
        document.getElementById('skills').value = applicant.skills?.join(', ') || '';
        document.getElementById('experience').value = applicant.experience;
        document.getElementById('status').value = applicant.status;
        document.getElementById('notes').value = applicant.notes || '';
        
        // Remove required from file input for edit
        document.getElementById('resume').required = false;
    } catch (error) {
        console.error('Error loading applicant:', error);
    }
}

// Handle Applicant Form Submit
async function handleApplicantSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    const formData = new FormData();
    formData.append('firstName', document.getElementById('firstName').value);
    formData.append('lastName', document.getElementById('lastName').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('skills', document.getElementById('skills').value);
    formData.append('experience', document.getElementById('experience').value);
    formData.append('status', document.getElementById('status').value);
    formData.append('notes', document.getElementById('notes').value);

    const resumeFile = document.getElementById('resume').files[0];
    if (resumeFile) {
        formData.append('resume', resumeFile);
    }

    try {
        const url = id ? `${API_URL}/applicants/${id}` : `${API_URL}/applicants`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            window.location.href = 'applicants.html';
        } else {
            const error = await response.json();
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = error.message || 'Error saving applicant';
        }
    } catch (error) {
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Error saving applicant';
    }
}

// Delete Applicant (Admin Only)
async function deleteApplicant(id) {
    // This will now only be called if the button is shown (admin only)
    if (!confirm('Are you sure you want to delete this applicant?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/applicants/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadApplicants();
        } else if (response.status === 403) {
            alert('You do not have permission to delete applicants. Only admins can delete.');
        }
    } catch (error) {
        console.error('Error deleting applicant:', error);
        alert('Error deleting applicant');
    }
}

// Download Resume
async function downloadResume(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/applicants/${id}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading resume:', error);
        alert('Error downloading resume');
    }
}

// Navigation Functions
function editApplicant(id) {
    window.location.href = `applicant-form.html?id=${id}`;
}

// Logout - UPDATED VERSION
function logout() {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear session storage as well (just in case)
    sessionStorage.clear();
    
    // Redirect to login
    window.location.href = 'login.html';
}

// Check authentication for protected pages
const protectedPages = ['dashboard.html', 'applicants.html', 'applicant-form.html'];
if (protectedPages.some(page => window.location.pathname.includes(page))) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Debug function - call this from browser console to check status
function checkAuthStatus() {
    console.log('=== AUTH STATUS ===');
    console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('User:', localStorage.getItem('user'));
    
    if (localStorage.getItem('user')) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            console.log('User role:', user.role);
            console.log('User email:', user.email);
        } catch (e) {
            console.log('Error parsing user data');
        }
    }
}