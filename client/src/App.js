import React, { useState } from 'react';
import './App.css';

function App() {
  const [sqlQuery, setSqlQuery] = useState('');
  const [modifiedSQL, setModifiedSQL] = useState('');
  const [columnMap, setColumnMap] = useState({});

  const handleQueryChange = (event) => {
    setSqlQuery(event.target.value);
  };

  const handleParseQuery = () => {
    fetch('https://probable-fiesta-7rww99x4v95fx7g-5000.app.github.dev/api/modify-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sqlQuery }),
    })
      .then((response) => response.json())
      .then((data) => {
        setModifiedSQL(data.modifiedSQL);
        setColumnMap(data.columnMap);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  return (
    <div className="App">
      <h1>SQL Query Modifier</h1>
      <div>
        <label>Enter SQL Query:</label>
        <textarea value={sqlQuery} onChange={handleQueryChange}></textarea>
      </div>
      <div>
        <button onClick={handleParseQuery}>Parse and Modify</button>
      </div>
      <div>
        <h2>Modified SQL:</h2>
        <pre>{modifiedSQL}</pre>
      </div>
      <div>
        <h2>Column Map:</h2>
        <pre>{JSON.stringify(columnMap, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;
