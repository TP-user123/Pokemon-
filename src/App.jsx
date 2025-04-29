import React, { useEffect, useState } from 'react';
import './App.css';

const POKEMON_LIMIT = 150;

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [filteredPokemons, setFilteredPokemons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [types, setTypes] = useState([]);

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
        setFilteredPokemons(detailedData);
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
    const filtered = pokemons.filter(pokemon => {
      const matchesName = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter ? pokemon.types.some(t => t.type.name === typeFilter) : true;
      return matchesName && matchesType;
    });
    setFilteredPokemons(filtered);
  }, [searchTerm, typeFilter, pokemons]);

  return (
    <div className="app">
      <header className="header">PokéDex</header>
      <div className="controls">
        <input
          type="text"
          placeholder="Search Pokémon by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {types.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="status">Loading Pokémon...</div>
      ) : error ? (
        <div className="status error">{error}</div>
      ) : filteredPokemons.length === 0 ? (
        <div className="status">No Pokémon match your search.</div>
      ) : (
        <div className="pokemon-list">
          {filteredPokemons.map((pokemon) => (
            <div key={pokemon.id} className="pokemon-card">
              <img src={pokemon.sprites.front_default} alt={pokemon.name} />
              <h3>{pokemon.name}</h3>
              <p>ID: #{pokemon.id}</p>
              <p>Type: {pokemon.types.map(t => t.type.name).join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;