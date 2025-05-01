import React from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./PokemonDetail.css";
import { FaArrowLeft } from 'react-icons/fa';

function PokemonDetail({ pokemons }) {
  const { id } = useParams();
  const [details, setDetails] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function fetchDetail() {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        setDetails(data);

        const speciesRes = await fetch(data.species.url);
        const species = await speciesRes.json();
        const evoRes = await fetch(species.evolution_chain.url);
        const evoData = await evoRes.json();
        setEvolution(evoData);

        const entry = species.flavor_text_entries.find(e => e.language.name === 'en');
        setDescription(entry ? entry.flavor_text.replace(/\f|\n/g, ' ') : 'No description available.');
      } catch (err) {
        console.error('Failed to load detailed info:', err);
      }
    }
    fetchDetail();
  }, [id]);

  if (!details) return <div className="status">Loading details...</div>;

  return (
    <div className="pokemon-detail container">
    <Link to="/" className="back-link">
    <FaArrowLeft /> Back to list
    </Link>

    <div className="pokemon-header">
      <img src={details.sprites.front_default} alt={details.name} className="pokemon-img" />
      <h2>{details.name}</h2>
      <p>ID: #{details.id}</p>
      <p>Type: {details.types.map(t => t.type.name).join(', ')}</p>
    </div>

    <div className="pokemon-section">
      <h4>Description</h4>
      <p>{description}</p>
    </div>

    <div className="pokemon-section stats">
      <h4>Stats</h4>
      <ul>
        {details.stats.map(stat => (
          <li key={stat.stat.name}>
            <strong>{stat.stat.name}:</strong> {stat.base_stat}
          </li>
        ))}
      </ul>
    </div>

    <div className="pokemon-section">
      <h4>Abilities</h4>
      <p>{details.abilities.map(a => a.ability.name).join(', ')}</p>
    </div>

    <div className="pokemon-section">
      <h4>Moves</h4>
      <p>{details.moves.slice(0, 5).map(m => m.move.name).join(', ')}{details.moves.length > 5 ? '...' : ''}</p>
    </div>

    <div className="pokemon-section evolution-chain">
      <h4>Evolution Chain</h4>
      {evolution && (
        <ul>
          {getEvolutionChain(evolution.chain).map(name => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  </div>
  );
}

function getEvolutionChain(chain, evolutions = []) {
  if (!chain) return evolutions;
  evolutions.push(chain.species.name);
  if (chain.evolves_to.length > 0) {
    return getEvolutionChain(chain.evolves_to[0], evolutions);
  }
  return evolutions;
}

export default PokemonDetail;