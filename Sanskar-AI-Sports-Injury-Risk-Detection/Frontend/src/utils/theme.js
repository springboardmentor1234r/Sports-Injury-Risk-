const THEME_KEY = 'kineguard-theme';

const getPreferredTheme = () => {
  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

const initializeTheme = () => applyTheme(getPreferredTheme());

const toggleTheme = () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  window.localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
};

export { initializeTheme, toggleTheme };
