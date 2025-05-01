import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import './App.css';
import PokemonDetail from './PokemonDetail';

const POKEMON_LIMIT = 150;

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilters, setTypeFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [types, setTypes] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favorites')) || []);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('id');

  useEffect(() => {
    async function fetchPokemons() {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${POKEMON_LIMIT}`);
        const data = await response.json();
        const detailedData = await Promise.all(
          data.results.map(async (pokemon) => {
            const res = await fetch(pokemon.url);
            return res.json();
          })
        );
        setPokemons(detailedData);
        setLoading(false);

        const allTypes = new Set();
        detailedData.forEach(p => p.types.forEach(t => allTypes.add(t.type.name)));
        setTypes(Array.from(allTypes));
      } catch (err) {
        setError('Failed to fetch Pokémon data');
        setLoading(false);
      }
    }
    fetchPokemons();
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleFavorite = useCallback((id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]);
  }, []);

  const handleTypeFilter = (type) => {
    setTypeFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const filtered = useMemo(() => {
    let result = pokemons.filter(pokemon =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (typeFilters.length === 0 || typeFilters.every(f => pokemon.types.some(t => t.type.name === f)))
    );

    result = result.sort((a, b) => {
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [pokemons, searchTerm, typeFilters, sortBy]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <Router>
      <div className="app container">
        <header className="header">PokéDex</header>
        <Routes>
          <Route path="/" element={
            <div>
              <div className="controls">
                <input
                  type="text"
                  placeholder="Search Pokémon by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}>
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n} per page</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="id">Sort by ID</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>
              <div className="multi-filters">
                {types.map((type) => (
                  <label key={type} className="type-filter">
                    <input
                      type="checkbox"
                      value={type}
                      checked={typeFilters.includes(type)}
                      onChange={() => handleTypeFilter(type)}
                    /> {type}
                  </label>
                ))}
              </div>
              <div className="favorites-section">
                <h3>Favorites</h3>
                <div className="pokemon-list">
                  {pokemons.filter(p => favorites.includes(p.id)).map(pokemon => (
                    <Link to={`/pokemon/${pokemon.id}`} key={pokemon.id} className="pokemon-card">
                      <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                      <h3>{pokemon.name}</h3>
                      <p>ID: #{pokemon.id}</p>
                      <p>Type: {pokemon.types.map(t => t.type.name).join(', ')}</p>
                      <button onClick={(e) => { e.preventDefault(); handleFavorite(pokemon.id); }}>
                        {favorites.includes(pokemon.id) ? '★' : '☆'}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="status">Loading Pokémon...</div>
              ) : error ? (
                <div className="status error">{error}</div>
              ) : filtered.length === 0 ? (
                <div className="status">No Pokémon match your search.</div>
              ) : (
                <div>
                  <div className="pokemon-list">
                    {paginated.map((pokemon) => (
                      <Link to={`/pokemon/${pokemon.id}`} key={pokemon.id} className="pokemon-card">
                        <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                        <h3>{pokemon.name}</h3>
                        <p>ID: #{pokemon.id}</p>
                        <p>Type: {pokemon.types.map(t => t.type.name).join(', ')}</p>
                        <button onClick={(e) => { e.preventDefault(); handleFavorite(pokemon.id); }}>
                          {favorites.includes(pokemon.id) ? '★' : '☆'}
                        </button>
                      </Link>
                    ))}
                  </div>
                  <div className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i} onClick={() => setCurrentPage(i + 1)} disabled={currentPage === i + 1}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          } />
          <Route path="/pokemon/:id" element={<PokemonDetail pokemons={pokemons} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
