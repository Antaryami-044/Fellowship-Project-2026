import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

// For local-host: 'http://localhost:5000'
const API_BASE_URL = 'https://fellowship-project-2026.onrender.com';

function App() {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all states on initial load
  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/states`)
      .then(res => {
        setStates(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching states:", err);
        setError('Could not load states. Is the API running?');
        setLoading(false);
      });
  }, []);

  // Try to get user's location
  useEffect(() => {
    // Run this only if states are loaded and user hasn't selected anything
    if ("geolocation" in navigator && states.length > 0 && !selectedState) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const apiState = res.data.address.state;
            const apiDistrict = res.data.address.county || res.data.address.state_district;

            const matchedState = states.find(s => s.toUpperCase() === apiState.toUpperCase());

            if (matchedState) {
              setSelectedState(matchedState);
              const cleanDistrict = apiDistrict.replace(' District', '').toUpperCase();
              setSelectedDistrict(cleanDistrict);
            }
          } catch (geoErr) {
            console.log("Geolocation API error:", geoErr);
          }
        },
        // eslint-disable-next-line no-unused-vars
        (err) => console.log("User denied location access.")
      );
    }
  }, [states]);

  // Fetch districts WHEN 'selectedState' changes
  useEffect(() => {
    if (selectedState) {
      setLoading(true);
      setError('');
      setData(null);
      setDistricts([]);

      axios.get(`${API_BASE_URL}/api/districts/${selectedState}`)
        .then(res => {
          setDistricts(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching districts:", err);
          setError(`Could not load districts for ${selectedState}.`);
          setLoading(false);
        });
    }
  }, [selectedState]);

  // Fetch data WHEN 'selectedDistrict' changes
  useEffect(() => {
    if (selectedDistrict) {
      setLoading(true);
      setError('');
      setData(null);

      axios.get(`${API_BASE_URL}/api/performance/${selectedDistrict}`)
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching performance data:", err);
          setError("Select you District   /   Data can't found.");
          setLoading(false);
        });
    }
  }, [selectedDistrict]);

  const latestData = data && data.length > 0 ? data[0] : null;

  return (
    <div className="container">
      <header className="header">
        <h1>ଆମ ସ୍ୱର, ଆମ ଅଧିକାର</h1>
        <h2>(Our Voice, Our Rights)</h2>
      </header>

      <div className="selector-box">
        <div className="select-group">
          <label htmlFor="state-select">Select your State</label>
          <select
            id="state-select"
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict('');
            }}
            disabled={loading}
          >
            <option value="">-- Select State --</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div className="select-group">
          <label htmlFor="district-select">Select your District</label>
          <select
            id="district-select"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedState || loading}
          >
            <option value="">-- Select District --</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading && <p className="loading-message">Loading data...</p>}

      {data && latestData && (
        <div className="dashboard">
          <h3>{latestData.district_name} - {latestData.financial_year} (Latest Data)</h3>

          <div className="card-row">
            <div className="card">
              <h4>ଲୋକଙ୍କୁ କାମ ମିଳିଲା</h4>
              <div className="big-number">{latestData.total_households_provided_employment.toLocaleString('en-IN')}</div>
              <div className="card-label">Households Got Work</div>
            </div>
            <div className="card">
              <h4>ମୋଟ ଶ୍ରମିକ</h4>
              <div className="big-number">{latestData.total_workers.toLocaleString('en-IN')}</div>
              <div className="card-label">Total Workers</div>
            </div>
          </div>

          <h4 className="chart-title">Historical Performance: Households Given Work</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.slice().reverse()}>
                <XAxis dataKey="financial_year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_households_provided_employment" fill="#4a90e2" name="Households" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h4 className="chart-title">Historical Performance: Total Workers</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.slice().reverse()}>
                <XAxis dataKey="financial_year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_workers" fill="#50e3c2" name="Total Workers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;