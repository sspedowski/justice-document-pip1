/* Justice Dashboard — client-side (v2) */

// CSV download helper function
// function downloadCSV(rows) {
//   const header = ['Filename','Summary','Category','Child','Misconduct','Duplicate'];
//   const body = rows.map(r => header.map(h => JSON.stringify(r[h.toLowerCase()] ?? '')).join(','));
//   const csv = [header.join(','), ...body].join('\n');
//   const blob = new Blob([csv], {type:'text/csv'});
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url; a.download = 'tracker.csv'; a.click();
//   URL.revokeObjectURL(url);
// }

/*
   Features added:
   • Multi‑file upload (drag‑and‑drop or file input)
   • SHA‑256 duplicate detection client‑side
   • Tracker persisted in localStorage (key: "tracker")
   • Search bar + child filter
   • CSV export including new columns: child, category, duplicate
   • Enhanced legal statute tagging with document-specific detection
   • Summary cards for detailed document analysis
   • Toggle view for summary cards with legal significance indicators
*/

// ===== Authentication State =====
// (auth object removed as it was unused)

// ===== 1. Utility helpers =====

// ===== Login Functionality =====
document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-form');
  const dashboardSection = document.getElementById('dashboard');
  const loginBtn = document.getElementById('loginBtn');
  const userInput = document.getElementById('userInput');
  const passInput = document.getElementById('passInput');
  const loginErr = document.getElementById('loginErr');

  // Hide dashboard initially
  if (dashboardSection) dashboardSection.style.display = 'none';

  // Check for existing auth token
  const token = localStorage.getItem('authToken');
  if (token) {
    validateToken(token).then(valid => {
      if (valid) showDashboard();
    });
  }

  // Login button click handler
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const username = userInput.value;
      const password = passInput.value;
      
      if (!username || !password) {
        if (loginErr) {
          loginErr.textContent = 'Please enter both username and password';
          loginErr.classList.remove('hidden');
        }
        return;
      }

      const result = await tryLogin(username, password);
      if (result.success) {
        if (loginSection) loginSection.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'block';
        if (loginErr) loginErr.classList.add('hidden');
      } else {
        if (loginErr) {
          loginErr.textContent = result.error || 'Invalid credentials';
          loginErr.classList.remove('hidden');
        }
      }
    });
  }

  // Add Enter key support for login
  if (userInput && passInput) {
    const handleEnterKey = event => {
      if (event.key === 'Enter') {
        loginBtn.click();
      }
    };

    userInput.addEventListener('keypress', handleEnterKey);
    passInput.addEventListener('keypress', handleEnterKey);
  }
});

// Login function
async function tryLogin(username, password) {
  try {
    console.log('Attempting login with username:', username);
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      console.log('Login successful');
      // Store auth data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      console.error('Login failed:', data);
      return { success: false, error: data.error || 'Invalid credentials' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Token validation function
async function validateToken(token) {
  try {
    const response = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Show/hide login and dashboard functions
function showLogin() {
  const loginForm = document.getElementById('login-form');
  const dashboard = document.getElementById('dashboard');
  
  if (loginForm) loginForm.style.display = 'block';
  if (dashboard) dashboard.style.display = 'none';
}

function showDashboard() {
  const loginForm = document.getElementById('login-form');
  const dashboard = document.getElementById('dashboard');
  
  if (loginForm) loginForm.style.display = 'none';
  if (dashboard) dashboard.style.display = 'block';
}

// Legal statute tagging logic
// function tagStatutes(doc) {
//   const statutes = [];
//   const text = (doc.content || doc.summary || doc.filename || '').toLowerCase();

//   // Constitutional Violations
//   if (text.includes('due process') || text.includes('14th amendment'))
//     statutes.push('14th Amendment – Due Process');
//   if (text.includes('1st amendment') || text.includes('free speech'))
//     statutes.push('1st Amendment – Free Speech');

//   return statutes;
// }
