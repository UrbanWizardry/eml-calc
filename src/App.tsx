import { Calculator } from './components/Calculator'
import './index.css'

function App() {
  return (
    <>
      <header className="app-header">
        <h1>EML Calculator</h1>
        <p className="subtitle">eml(x, y) = exp(x) &minus; ln(y)</p>
      </header>
      <Calculator />
      <footer className="app-footer">
        Based on &ldquo;All elementary functions from a single operator&rdquo; &mdash; Odrzywo&#322;ek (2026)
      </footer>
    </>
  )
}

export default App
