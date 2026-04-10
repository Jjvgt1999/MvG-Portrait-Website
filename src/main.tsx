import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Note: StrictMode is intentionally omitted. The scroll engine is a singleton
// with imperative DOM listeners and a rAF loop; StrictMode's double-invoke of
// effects would race init/destroy with the engine's async measure step.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
