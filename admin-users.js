#!/usr/bin/env node

/**
 * Justice Dashboard - User Management Utility
 * Manage users from the command line.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const readline = require('readline');

const usersPath = path.join(__dirname, 'users.json');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Utility functions
function getUsers() {
  if (!fs.existsSync(usersPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log('Users saved successfully');
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

async function addUser(username, password, role = 'user', fullName = '') {
  const users = getUsers();
  const existingUser = users.find((u) => u.username === username);
  if (existingUser) {
    console.log('Username already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const nextId = users.length ? Math.max(...users.map((u) => u.id || 0)) + 1 : 1;
  const newUser = {
    id: nextId,
    username,
    password: hashedPassword,
    role,
    fullName,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  console.log(`User "${username}" created successfully`);
}

function listUsers() {
  const users = getUsers();
  if (users.length === 0) {
    console.log('No users found');
    return;
  }
  console.log('\nCurrent Users:');
  console.log('================');
  users.forEach((user) => {
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log(`Full Name: ${user.fullName || 'Not set'}`);
    console.log(`Created: ${user.createdAt}`);
    console.log('---');
  });
}

function deleteUser(userId) {
  const users = getUsers();
  const idNum = parseInt(userId, 10);
  const userIndex = users.findIndex((u) => (u.id || 0) === idNum);
  if (userIndex === -1) {
    console.log('User not found');
    return;
  }
  const deletedUser = users.splice(userIndex, 1)[0];
  saveUsers(users);
  console.log(`User "${deletedUser.username}" deleted successfully`);
}

// Initialize with default users if file doesn't exist
function initializeUsers() {
  if (!fs.existsSync(usersPath)) {
    console.log('Creating initial users file...');
    const initialUsers = [
      {
        id: 1,
        username: 'admin',
        password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'adminpass', 10),
        role: 'admin',
        fullName: 'System Administrator',
        createdAt: new Date().toISOString(),
      },
    ];
    saveUsers(initialUsers);
    console.log('Initial users created:');
    console.log('   - admin / [password from env or default] (Administrator)');
  }
}

// Main menu
function showMenu() {
  console.log('\nJustice Dashboard - User Management');
  console.log('=====================================');
  console.log('1. List all users');
  console.log('2. Add new user');
  console.log('3. Delete user');
  console.log('4. Initialize default users');
  console.log('5. Exit');
  console.log('=====================================');
}

// Handle menu choices
async function handleChoice(choice) {
  switch (choice) {
    case '1':
      listUsers();
      break;
    case '2':
      console.log('\nAdd New User');
      console.log('================');
      // prompts
      const username = await new Promise((resolve) => rl.question('Username: ', resolve));
      const password = await new Promise((resolve) => rl.question('Password: ', resolve));
      const role = await new Promise((resolve) =>
        rl.question('Role (admin/user) [user]: ', (answer) =>
          resolve(answer && answer.toLowerCase() === 'admin' ? 'admin' : 'user')
        )
      );
      const fullName = await new Promise((resolve) => rl.question('Full Name (optional): ', resolve));
      await addUser(username, password, role, fullName);
      break;
    case '3':
      console.log('\nDelete User');
      console.log('===============');
      listUsers();
      const userId = await new Promise((resolve) => rl.question('Enter User ID to delete: ', resolve));
      deleteUser(userId);
      break;
    case '4':
      console.log('\nInitialize Default Users');
      console.log('============================');
      initializeUsers();
      break;
    case '5':
      console.log('Goodbye!');
      rl.close();
      return;
    default:
      console.log('Invalid choice');
  }

  // Show menu again
  setTimeout(() => {
    showMenu();
    rl.question('Choose an option (1-5): ', handleChoice);
  }, 500);
}

// Start the application
console.log('Starting Justice Dashboard User Management...');
showMenu();
rl.question('Choose an option (1-5): ', handleChoice);

