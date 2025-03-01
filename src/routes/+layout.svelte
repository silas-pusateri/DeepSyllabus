<script>
  // Initialize the database when the app loads
  import { onMount } from 'svelte';
  
  onMount(async () => {
    try {
      await fetch('/api/init-db', { method: 'POST' });
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="app">
  <header>
    <div class="container">
      <div class="logo">
        <a href="/">
          <h1>OpenSyllabus</h1>
        </a>
      </div>
      <nav>
        <ul>
          <li><a href="/" class="nav-link">Home</a></li>
          <li><a href="/syllabi" class="nav-link">My Syllabi</a></li>
        </ul>
      </nav>
    </div>
  </header>
  
  <main>
    <div class="container">
      <slot></slot>
    </div>
  </main>
  
  <footer>
    <div class="container">
      <p>&copy; {new Date().getFullYear()} OpenSyllabus | Powered by OpenDeepResearch</p>
    </div>
  </footer>
</div>

<style>
  :global(:root) {
    /* Neumorphic color palette - Teal Professional */
    --bg-color: #e0e5ec;
    --text-color: #333;
    --text-muted: #666;
    --primary-color: #38b2ac; /* Teal */
    --primary-light: #4fd1cc; /* Light Teal */
    --primary-dark: #2c8c87;  /* Dark Teal */
    --shadow-light: #ffffff;
    --shadow-dark: #c3c9d3;
    --card-bg: #e0e5ec;
    --success-color: #4bbe8e;
    --danger-color: #e76f6f;
    --border-radius: 12px;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
    line-height: 1.6;
  }
  
  :global(*) {
    box-sizing: border-box;
  }

  :global(h1, h2, h3, h4, h5, h6) {
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
  }

  /* Neumorphic utility classes */
  :global(.neu-inset) {
    background: var(--card-bg);
    box-shadow: inset 5px 5px 10px var(--shadow-dark), 
                inset -5px -5px 10px var(--shadow-light);
    border-radius: var(--border-radius);
  }

  :global(.neu-outset) {
    background: var(--card-bg);
    box-shadow: 5px 5px 10px var(--shadow-dark), 
                -5px -5px 10px var(--shadow-light);
    border-radius: var(--border-radius);
  }

  :global(.neu-button) {
    background: var(--card-bg);
    box-shadow: 5px 5px 10px var(--shadow-dark), 
                -5px -5px 10px var(--shadow-light);
    border-radius: var(--border-radius);
    border: none;
    padding: 0.7rem 1.5rem;
    font-weight: 600;
    font-family: 'Montserrat', sans-serif;
    color: var(--primary-color);
    cursor: pointer;
    transition: all 0.2s ease, transform 0.1s ease, background-color 0.1s ease;
    position: relative;
    overflow: hidden;
  }

  :global(.neu-button:hover) {
    box-shadow: 6px 6px 12px var(--shadow-dark), 
                -6px -6px 12px var(--shadow-light);
    color: var(--primary-dark);
  }

  :global(.neu-button:active) {
    box-shadow: inset 3px 3px 7px var(--shadow-dark), 
                inset -3px -3px 7px var(--shadow-light);
    transform: translateY(2px);
    background-color: #daddea;
    transition: all 0.1s ease;
  }

  :global(.neu-button.primary) {
    background: var(--primary-color);
    color: white;
    box-shadow: 3px 3px 7px rgba(56, 178, 172, 0.4),
                -3px -3px 7px rgba(56, 178, 172, 0.1),
                inset 0 0 0 rgba(56, 178, 172, 0);
    position: relative;
    transition: all 0.2s ease, transform 0.1s ease, background-color 0.1s ease;
  }

  :global(.neu-button.primary:hover) {
    box-shadow: 4px 4px 8px rgba(56, 178, 172, 0.5),
                -4px -4px 8px rgba(56, 178, 172, 0.2);
    background-color: var(--primary-light);
  }

  :global(.neu-button.primary:active) {
    box-shadow: 0 0 0 rgba(56, 178, 172, 0),
                0 0 0 rgba(56, 178, 172, 0),
                inset 3px 3px 7px rgba(44, 140, 135, 0.5),
                inset -3px -3px 7px rgba(79, 209, 204, 0.3);
    transform: translateY(2px);
    background-color: var(--primary-dark);
    transition: all 0.1s ease;
  }

  :global(.neu-button:focus) {
    outline: none;
    box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.3),
                6px 6px 12px var(--shadow-dark), 
                -6px -6px 12px var(--shadow-light);
  }

  :global(.neu-button.primary:focus) {
    outline: none;
    box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.3),
                4px 4px 8px rgba(56, 178, 172, 0.5),
                -4px -4px 8px rgba(56, 178, 172, 0.2);
  }

  :global(.neu-input) {
    background: var(--bg-color);
    border: none;
    box-shadow: inset 3px 3px 7px var(--shadow-dark), 
                inset -3px -3px 7px var(--shadow-light);
    border-radius: var(--border-radius);
    padding: 0.8rem 1.2rem;
    font-family: 'Lato', sans-serif;
    outline: none;
    transition: all 0.3s ease;
  }

  :global(.neu-input:focus) {
    box-shadow: inset 4px 4px 8px var(--shadow-dark), 
                inset -4px -4px 8px var(--shadow-light);
  }

  :global(.neu-card) {
    background: var(--card-bg);
    box-shadow: 7px 7px 14px var(--shadow-dark), 
                -7px -7px 14px var(--shadow-light);
    border-radius: var(--border-radius);
    padding: 2rem;
    transition: all 0.3s ease;
  }

  :global(.neu-card:hover) {
    box-shadow: 9px 9px 18px var(--shadow-dark), 
                -9px -9px 18px var(--shadow-light);
  }
  
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }
  
  header {
    background-color: var(--bg-color);
    color: var(--primary-color);
    padding: 1.5rem 0;
    box-shadow: 0 3px 10px var(--shadow-dark);
    margin-bottom: 2rem;
  }
  
  header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo h1 {
    margin: 0;
    font-size: 1.8rem;
    color: var(--primary-color);
    text-shadow: 1px 1px 1px var(--shadow-light), 
                 -1px -1px 1px var(--shadow-dark);
  }
  
  .logo a {
    color: var(--primary-color);
    text-decoration: none;
  }
  
  nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 1.5rem;
  }
  
  .nav-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 600;
    padding: 0.7rem 1.2rem;
    border-radius: var(--border-radius);
    transition: all 0.3s ease;
    box-shadow: 3px 3px 7px var(--shadow-dark),
                -3px -3px 7px var(--shadow-light);
  }
  
  .nav-link:hover {
    box-shadow: 5px 5px 10px var(--shadow-dark),
                -5px -5px 10px var(--shadow-light);
    color: var(--primary-dark);
  }
  
  .nav-link:active {
    box-shadow: inset 2px 2px 5px var(--shadow-dark),
                inset -2px -2px 5px var(--shadow-light);
  }
  
  main {
    flex: 1;
    padding: 1rem 0 3rem;
  }
  
  footer {
    background-color: var(--bg-color);
    padding: 1.5rem 0;
    margin-top: auto;
    box-shadow: 0 -2px 10px var(--shadow-dark);
  }
  
  footer p {
    margin: 0;
    text-align: center;
    color: var(--text-muted);
  }
  
  @media (max-width: 768px) {
    header .container {
      flex-direction: column;
      gap: 1rem;
    }
  }

  :global(.neu-button:disabled) {
    background-color: #eaecf1;
    color: #a0a0a0;
    cursor: not-allowed;
    box-shadow: 3px 3px 6px var(--shadow-dark), 
                -3px -3px 6px var(--shadow-light);
  }

  :global(.neu-button:disabled:hover),
  :global(.neu-button:disabled:active),
  :global(.neu-button:disabled:focus) {
    transform: none;
    box-shadow: 3px 3px 6px var(--shadow-dark), 
                -3px -3px 6px var(--shadow-light);
    background-color: #eaecf1;
  }

  :global(.neu-button.primary:disabled) {
    background-color: #9acac8;
    color: #e0e5ec;
    cursor: not-allowed;
    box-shadow: 3px 3px 6px rgba(56, 178, 172, 0.2),
                -3px -3px 6px rgba(56, 178, 172, 0.05);
  }

  :global(.neu-button.primary:disabled:hover),
  :global(.neu-button.primary:disabled:active),
  :global(.neu-button.primary:disabled:focus) {
    transform: none;
    background-color: #9acac8;
    box-shadow: 3px 3px 6px rgba(56, 178, 172, 0.2),
                -3px -3px 6px rgba(56, 178, 172, 0.05);
  }
</style> 