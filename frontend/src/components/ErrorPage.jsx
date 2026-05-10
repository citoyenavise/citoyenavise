const ErrorPage = ({ error }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '2rem',
  }}
  >
    <h1 style={{ color: '#C8102E' }}>Oups! Une erreur s\'est produite</h1>
    <p style={{ color: '#666', marginBottom: '2rem' }}>
      Notre équipe a été notifiée. Veuillez réessayer plus tard.
    </p>
    <button
      onClick={() => window.location.href = '/'}
      style={{
        padding: '0.8rem 1.5rem',
        backgroundColor: '#C8102E',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
      }}
    >
      Retour à l'accueil
    </button>
  </div>
);

export default ErrorPage;
