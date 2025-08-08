// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
let editingId = null;
let editingType = null;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    if (authToken) {
        showDashboard();
        loadAllData();
    } else {
        showLogin();
    }
    
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Auth Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // CRUD Forms
    document.getElementById('customerForm').addEventListener('submit', handleCustomerSubmit);
    document.getElementById('leadForm').addEventListener('submit', handleLeadSubmit);
    document.getElementById('contactForm').addEventListener('submit', handleContactSubmit);
    document.getElementById('stageForm').addEventListener('submit', handleStageSubmit);
    
    // Modal overlay click to close
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.loading-spinner');
    
    // Show loading state
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = { email };
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMessage('Login successful!', 'success');
            showDashboard();
            loadAllData();
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.loading-spinner');
    
    // Show loading state
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registration successful! Please login.', 'success');
            showLogin();
        } else {
            showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = {};
    showLogin();
}

// Page Navigation
function showLogin() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('loginPage').classList.add('active');
}

function showRegister() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('registerPage').classList.add('active');
}

function showDashboard() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('userEmail').textContent = currentUser.email;
}

// Tab Management
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Load data for the active tab
    switch(tabName) {
        case 'customers': loadCustomers(); break;
        case 'leads': loadLeads(); break;
        case 'contacts': loadContacts(); break;
        case 'stages': loadStages(); break;
    }
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        ...options
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        showMessage(error.message, 'error');
        throw error;
    }
}

// Data Loading Functions
async function loadAllData() {
    await Promise.all([
        loadCustomers(),
        loadLeads(),
        loadContacts(),
        loadStages()
    ]);
    updateStats();
}

// Update Dashboard Stats
async function updateStats() {
    try {
        const [customers, leads, contacts, stages] = await Promise.all([
            apiRequest('/customers'),
            apiRequest('/leads'),
            apiRequest('/contacts'),
            apiRequest('/stages')
        ]);
        
        animateCounter('totalCustomers', customers.data?.length || 0);
        animateCounter('totalLeads', leads.data?.length || 0);
        animateCounter('totalContacts', contacts.data?.length || 0);
        animateCounter('totalStages', stages.data?.length || 0);
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Animate counter numbers
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

async function loadCustomers() {
    try {
        const data = await apiRequest('/customers');
        displayCustomers(data.data || []);
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

async function loadLeads() {
    try {
        const data = await apiRequest('/leads');
        displayLeads(data.data || []);
    } catch (error) {
        console.error('Error loading leads:', error);
    }
}

async function loadContacts() {
    try {
        const data = await apiRequest('/contacts');
        displayContacts(data.data || []);
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

async function loadStages() {
    try {
        const data = await apiRequest('/stages');
        displayStages(data.data || []);
    } catch (error) {
        console.error('Error loading stages:', error);
    }
}

// Display Functions
function displayCustomers(customers) {
    const tbody = document.querySelector('#customersTable tbody');
    tbody.innerHTML = '';
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No customers found</td></tr>';
        return;
    }
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        const createdDate = new Date(customer.created_at).toLocaleString();
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.company || '-'}</td>
            <td>${createdDate}</td>
            <td>
                <button class="action-btn btn-edit" onclick="editCustomer(${customer.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn btn-delete" onclick="deleteCustomer(${customer.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayLeads(leads) {
    const tbody = document.querySelector('#leadsTable tbody');
    tbody.innerHTML = '';
    
    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No leads found</td></tr>';
        return;
    }
    
    leads.forEach(lead => {
        const row = document.createElement('tr');
        const createdDate = new Date(lead.created_at).toLocaleString();
        row.innerHTML = `
            <td>${lead.customer_name || 'Unknown'}</td>
            <td>${lead.lead_source}</td>
            <td><span class="status-badge status-${lead.status}">${lead.status}</span></td>
            <td>$${parseFloat(lead.value || 0).toFixed(2)}</td>
            <td>${createdDate}</td>
            <td>
                <button class="action-btn btn-edit" onclick="editLead(${lead.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn btn-delete" onclick="deleteLead(${lead.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayContacts(contacts) {
    const tbody = document.querySelector('#contactsTable tbody');
    tbody.innerHTML = '';
    
    if (contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No contacts found</td></tr>';
        return;
    }
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.customer_name || 'Unknown'}</td>
            <td>${contact.contact_type}</td>
            <td>${contact.contact_value}</td>
            <td>${contact.is_primary ? '<span class="primary-badge">Primary</span>' : '-'}</td>
            <td>
                <button class="action-btn btn-edit" onclick="editContact(${contact.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn btn-delete" onclick="deleteContact(${contact.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayStages(stages) {
    const tbody = document.querySelector('#stagesTable tbody');
    tbody.innerHTML = '';
    
    if (stages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No stages found</td></tr>';
        return;
    }
    
    stages.forEach(stage => {
        const row = document.createElement('tr');
        const createdDate = new Date(stage.created_at).toLocaleDateString();
        row.innerHTML = `
            <td>Lead #${stage.lead_id}</td>
            <td>${stage.customer_name || 'Unknown'}</td>
            <td>${stage.stage_name}</td>
            <td>${createdDate}</td>
            <td>
                <button class="action-btn btn-edit" onclick="editStage(${stage.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn btn-delete" onclick="deleteStage(${stage.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Modal Functions
function showModal(modalId) {
    document.getElementById('modalOverlay').classList.add('active');
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
    document.getElementById(modalId).style.display = 'block';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    editingId = null;
    editingType = null;
    // Reset forms
    document.querySelectorAll('form').forEach(form => form.reset());
}

// Customer CRUD
async function showAddCustomerModal() {
    editingId = null;
    document.getElementById('customerModalTitle').textContent = 'Add Customer';
    showModal('customerModal');
}

async function editCustomer(id) {
    try {
        const data = await apiRequest(`/customers/${id}`);
        const customer = data.data;
        
        editingId = id;
        document.getElementById('customerModalTitle').textContent = 'Edit Customer';
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerEmail').value = customer.email;
        document.getElementById('customerPhone').value = customer.phone;
        document.getElementById('customerCompany').value = customer.company || '';
        document.getElementById('customerAddress').value = customer.address || '';
        
        showModal('customerModal');
    } catch (error) {
        console.error('Error loading customer:', error);
    }
}

async function handleCustomerSubmit(e) {
    e.preventDefault();
    
    const customerData = {
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        company: document.getElementById('customerCompany').value,
        address: document.getElementById('customerAddress').value
    };
    
    try {
        if (editingId) {
            await apiRequest(`/customers/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify(customerData)
            });
            showMessage('Customer updated successfully!', 'success');
        } else {
            await apiRequest('/customers', {
                method: 'POST',
                body: JSON.stringify(customerData)
            });
            showMessage('Customer added successfully!', 'success');
        }
        
        closeModal();
        loadCustomers();
        updateStats();
    } catch (error) {
        console.error('Error saving customer:', error);
    }
}

async function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        try {
            await apiRequest(`/customers/${id}`, { method: 'DELETE' });
            showMessage('Customer deleted successfully!', 'success');
            loadCustomers();
            updateStats();
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    }
}

// Lead CRUD
async function showAddLeadModal() {
    editingId = null;
    document.getElementById('leadModalTitle').textContent = 'Add Lead';
    await loadCustomerOptions('leadCustomer');
    showModal('leadModal');
}

async function editLead(id) {
    try {
        const data = await apiRequest(`/leads/${id}`);
        const lead = data.data;
        
        editingId = id;
        document.getElementById('leadModalTitle').textContent = 'Edit Lead';
        await loadCustomerOptions('leadCustomer');
        document.getElementById('leadCustomer').value = lead.customer_id;
        document.getElementById('leadSource').value = lead.lead_source;
        document.getElementById('leadStatus').value = lead.status;
        document.getElementById('leadValue').value = lead.value || '';
        document.getElementById('leadDescription').value = lead.description || '';
        
        showModal('leadModal');
    } catch (error) {
        console.error('Error loading lead:', error);
    }
}

async function handleLeadSubmit(e) {
    e.preventDefault();
    
    const leadData = {
        customer_id: parseInt(document.getElementById('leadCustomer').value),
        lead_source: document.getElementById('leadSource').value,
        status: document.getElementById('leadStatus').value,
        value: parseFloat(document.getElementById('leadValue').value) || 0,
        description: document.getElementById('leadDescription').value
    };
    
    try {
        if (editingId) {
            await apiRequest(`/leads/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify(leadData)
            });
            showMessage('Lead updated successfully!', 'success');
        } else {
            await apiRequest('/leads', {
                method: 'POST',
                body: JSON.stringify(leadData)
            });
            showMessage('Lead added successfully!', 'success');
        }
        
        closeModal();
        loadLeads();
        updateStats();
    } catch (error) {
        console.error('Error saving lead:', error);
    }
}

async function deleteLead(id) {
    if (confirm('Are you sure you want to delete this lead?')) {
        try {
            await apiRequest(`/leads/${id}`, { method: 'DELETE' });
            showMessage('Lead deleted successfully!', 'success');
            loadLeads();
            updateStats();
        } catch (error) {
            console.error('Error deleting lead:', error);
        }
    }
}

// Contact CRUD
async function showAddContactModal() {
    editingId = null;
    document.getElementById('contactModalTitle').textContent = 'Add Contact';
    await loadCustomerOptions('contactCustomer');
    showModal('contactModal');
}

async function editContact(id) {
    try {
        const data = await apiRequest(`/contacts/${id}`);
        const contact = data.data;
        
        editingId = id;
        document.getElementById('contactModalTitle').textContent = 'Edit Contact';
        await loadCustomerOptions('contactCustomer');
        document.getElementById('contactCustomer').value = contact.customer_id;
        document.getElementById('contactType').value = contact.contact_type;
        document.getElementById('contactValue').value = contact.contact_value;
        document.getElementById('contactPrimary').checked = contact.is_primary;
        
        showModal('contactModal');
    } catch (error) {
        console.error('Error loading contact:', error);
    }
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    const contactData = {
        customer_id: parseInt(document.getElementById('contactCustomer').value),
        contact_type: document.getElementById('contactType').value,
        contact_value: document.getElementById('contactValue').value,
        is_primary: document.getElementById('contactPrimary').checked
    };
    
    try {
        if (editingId) {
            await apiRequest(`/contacts/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify(contactData)
            });
            showMessage('Contact updated successfully!', 'success');
        } else {
            await apiRequest('/contacts', {
                method: 'POST',
                body: JSON.stringify(contactData)
            });
            showMessage('Contact added successfully!', 'success');
        }
        
        closeModal();
        loadContacts();
        updateStats();
    } catch (error) {
        console.error('Error saving contact:', error);
    }
}

async function deleteContact(id) {
    if (confirm('Are you sure you want to delete this contact?')) {
        try {
            await apiRequest(`/contacts/${id}`, { method: 'DELETE' });
            showMessage('Contact deleted successfully!', 'success');
            loadContacts();
            updateStats();
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    }
}

// Stage CRUD
async function showAddStageModal() {
    editingId = null;
    document.getElementById('stageModalTitle').textContent = 'Add Stage';
    await loadLeadOptions('stageLead');
    showModal('stageModal');
}

async function editStage(id) {
    try {
        const data = await apiRequest(`/stages/${id}`);
        const stage = data.data;
        
        editingId = id;
        document.getElementById('stageModalTitle').textContent = 'Edit Stage';
        await loadLeadOptions('stageLead');
        document.getElementById('stageLead').value = stage.lead_id;
        document.getElementById('stageName').value = stage.stage_name;
        
        showModal('stageModal');
    } catch (error) {
        console.error('Error loading stage:', error);
    }
}

async function handleStageSubmit(e) {
    e.preventDefault();
    
    const stageData = {
        lead_id: parseInt(document.getElementById('stageLead').value),
        stage_name: document.getElementById('stageName').value
    };
    
    try {
        if (editingId) {
            await apiRequest(`/stages/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify(stageData)
            });
            showMessage('Stage updated successfully!', 'success');
        } else {
            await apiRequest('/stages', {
                method: 'POST',
                body: JSON.stringify(stageData)
            });
            showMessage('Stage added successfully!', 'success');
        }
        
        closeModal();
        loadStages();
        updateStats();
    } catch (error) {
        console.error('Error saving stage:', error);
    }
}

async function deleteStage(id) {
    if (confirm('Are you sure you want to delete this stage?')) {
        try {
            await apiRequest(`/stages/${id}`, { method: 'DELETE' });
            showMessage('Stage deleted successfully!', 'success');
            loadStages();
            updateStats();
        } catch (error) {
            console.error('Error deleting stage:', error);
        }
    }
}

// Helper Functions
async function loadCustomerOptions(selectId) {
    try {
        const data = await apiRequest('/customers');
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Customer</option>';
        
        data.data.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.email})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading customer options:', error);
    }
}

async function loadLeadOptions(selectId) {
    try {
        const data = await apiRequest('/leads');
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Lead</option>';
        
        data.data.forEach(lead => {
            const option = document.createElement('option');
            option.value = lead.id;
            option.textContent = `${lead.customer_name || 'Unknown'} - ${lead.lead_source}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading lead options:', error);
    }
}

function showMessage(message, type) {
    // Remove existing messages
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // Add icon based on type
    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
    messageDiv.innerHTML = `<i class="${icon}"></i> ${message}`;
    
    // Insert at the top of the current active page
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        activePage.insertBefore(messageDiv, activePage.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(-20px)';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }
}
// Mobile Touch Interactions
function addMobileTouchSupport() {
    // Add touch feedback to buttons
    document.querySelectorAll('.btn-primary, .action-btn, .tab-btn').forEach(btn => {
        btn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        btn.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
            }, 100);
        });
    });
    
    // Swipe support for tables
    let startX = 0;
    document.querySelectorAll('.table-container').forEach(container => {
        container.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
        });
        
        container.addEventListener('touchmove', function(e) {
            if (e.touches.length === 1) {
                const currentX = e.touches[0].clientX;
                const diffX = startX - currentX;
                this.scrollLeft += diffX * 0.5;
                startX = currentX;
            }
        });
    });
    
    // Pull to refresh simulation
    let startY = 0;
    let pullDistance = 0;
    const refreshThreshold = 100;
    
    document.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchmove', function(e) {
        if (window.scrollY === 0) {
            pullDistance = e.touches[0].clientY - startY;
            if (pullDistance > 0 && pullDistance < refreshThreshold) {
                document.body.style.transform = `translateY(${pullDistance * 0.5}px)`;
                document.body.style.opacity = 1 - (pullDistance / refreshThreshold) * 0.2;
            }
        }
    });
    
    document.addEventListener('touchend', function() {
        if (pullDistance > refreshThreshold) {
            loadAllData();
            showMessage('Data refreshed!', 'success');
        }
        document.body.style.transform = '';
        document.body.style.opacity = '';
        pullDistance = 0;
    });
}

// Initialize mobile support when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    addMobileTouchSupport();
    
    // Existing initialization code...
    if (authToken) {
        showDashboard();
        loadAllData();
    } else {
        showLogin();
    }
    
    setupEventListeners();
});