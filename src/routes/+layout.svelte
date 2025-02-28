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
          <li><a href="/">Home</a></li>
          <li><a href="/syllabi">My Syllabi</a></li>
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
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f9f9f9;
    color: #333;
    line-height: 1.6;
  }
  
  :global(*) {
    box-sizing: border-box;
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
    background-color: #0066cc;
    color: white;
    padding: 1rem 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo h1 {
    margin: 0;
    font-size: 1.8rem;
  }
  
  .logo a {
    color: white;
    text-decoration: none;
  }
  
  nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 1.5rem;
  }
  
  nav a {
    color: white;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 0;
    transition: color 0.2s;
  }
  
  nav a:hover {
    color: #f0f0f0;
  }
  
  main {
    flex: 1;
    padding: 2rem 0;
  }
  
  footer {
    background-color: #f0f0f0;
    padding: 1.5rem 0;
    margin-top: auto;
    border-top: 1px solid #ddd;
  }
  
  footer p {
    margin: 0;
    text-align: center;
    color: #666;
  }
  
  @media (max-width: 768px) {
    header .container {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style> 