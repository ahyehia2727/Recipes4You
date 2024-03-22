import React, { useState, useEffect } from 'react';

function ReactComp() {
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    // The endpoint here corresponds to one of the Express server's endpoints.
    fetch('/api/hello')
      .then((response) => response.json())
      .then((data) => setServerMessage(data.message))
      .catch((error) => {
        console.error('Error fetching data: ', error);
        setServerMessage('Error fetching data');
      });
  }, []);

  return (
    <div>
      <p>Server says: {serverMessage}</p>
    </div>
  );
}

export default ReactComp;
