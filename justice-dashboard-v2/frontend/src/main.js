import './main.css';

const app = document.querySelector('#app');
if (app) {
  app.insertAdjacentHTML(
    'beforeend',
    '<p class="text-gray-600">Vite + Tailwind scaffold</p>'
  );
}

